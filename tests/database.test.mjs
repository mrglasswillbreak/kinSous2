import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";
import { migrationStatements } from "../scripts/migration-statements.mjs";
test("migrations and paid order lifecycle enforce ownership, uniqueness, disputes and one payout", async () => {
  const db = new PGlite();
  try {
    for (const name of (await readdir("migrations"))
      .filter((n) => n.endsWith(".sql"))
      .sort()) {
      const source = (await readFile("migrations/" + name, "utf8")).replace(
        "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
        "",
      );
      for (const statement of migrationStatements(source))
        await db.exec(statement);
    }
    await db.exec(`INSERT INTO users(id,email,name,password_hash,role,payout_account,payout_bank) VALUES ('s','s@example.test','Seeker','hash','SEEKER',NULL,NULL),('h','h@example.test','Helper','hash','HELPER','0123456789','044'),('h2','h2@example.test','Helper 2','hash','HELPER','0123456780','044');
   INSERT INTO bounties(id,title,description,category,budget,currency,seeker_id,status) VALUES ('b','Test bounty','Food delivery test','GROCERY',10000,'NGN','s','OPEN');
   INSERT INTO bids(id,bounty_id,helper_id,amount,currency,message,estimated_delivery_minutes,status) VALUES ('bid','b','h',10000,'NGN','Ready',60,'PENDING'),('bid2','b','h2',9000,'NGN','Ready',60,'PENDING');`);
    assert.equal(
      (await db.query(`SELECT accept_order('b','bid','h') AS id`)).rows[0].id,
      null,
    );
    const direct = (
      await db.query("SELECT direct_conversation('h','s',NULL) AS id")
    ).rows[0].id;
    const scoped = (
      await db.query("SELECT direct_conversation('h','s','b') AS id")
    ).rows[0].id;
    assert.notEqual(direct, scoped);
    assert.equal(
      (await db.query("SELECT direct_conversation('h','s','b') AS id")).rows[0]
        .id,
      scoped,
    );
    const attempts = await Promise.all([
      db.query(`SELECT accept_order('b','bid','s') AS id`),
      db.query(`SELECT accept_order('b','bid2','s') AS id`),
    ]);
    assert.equal(attempts.filter((r) => r.rows[0].id).length, 1);
    const o = (await db.query(`SELECT * FROM orders WHERE id='b'`)).rows[0];
    assert.equal(Number(o.amount_kobo), 1000000);
    assert.equal(Number(o.helper_kobo), 900000);
    assert.equal(Number(o.commission_kobo), 100000);
    const transition = async (stage, actor = "h", note = null) =>
      (
        await db.query("SELECT transition_order($1,$2,$3,$4) AS ok", [
          "b",
          actor,
          stage,
          note,
        ])
      ).rows[0].ok;
    assert.equal(
      await transition("SHOPPING"),
      false,
      "unpaid work cannot start",
    );
    assert.equal(
      await transition("COMPLETED", "s"),
      false,
      "undelivered work cannot complete",
    );
    await db.exec(
      `INSERT INTO payments(id,order_id,status,provider_id) VALUES ('pay','b','PAID','100'); UPDATE orders SET stage='PAID' WHERE id='b';`,
    );
    assert.equal(
      await transition("SHOPPING", "s"),
      false,
      "customer cannot update helper stage",
    );
    assert.equal(await transition("SHOPPING"), true);
    assert.equal(await transition("DELIVERED"), false, "cannot skip stages");
    assert.equal(await transition("IN_TRANSIT"), true);
    assert.equal(await transition("DELIVERED"), true);
    assert.equal(await transition("DISPUTE", "s", "Item was missing"), true);
    assert.equal(
      await transition("COMPLETED", "s"),
      false,
      "dispute pauses payout",
    );
    assert.equal(
      (
        await db.query(
          `SELECT resolve_order('b','s','RELEASE','Delivery confirmed after review') AS ok`,
        )
      ).rows[0].ok,
      true,
    );
    assert.equal(
      (
        await db.query(
          `SELECT resolve_order('b','s','RELEASE','Repeated admin resolution') AS ok`,
        )
      ).rows[0].ok,
      false,
    );
    assert.equal(
      Number((await db.query("SELECT count(*) FROM transfers")).rows[0].count),
      1,
    );
    await assert.rejects(
      db.exec(
        `INSERT INTO bids(id,bounty_id,helper_id,amount,currency,status) VALUES('dup','b','h2',100,'NGN','ACCEPTED')`,
      ),
    );
    await db.exec(
      `INSERT INTO sessions(id,user_id,expires_at) VALUES('session','s',now()+interval '1 day'); INSERT INTO auth_tokens(id,user_id,kind,email,expires_at) VALUES('token','s','RESET','s@example.test',now()+interval '30 minutes');`,
    );
    assert.equal(
      (await db.query(`SELECT redeem_account_token('token','newhash') AS ok`))
        .rows[0].ok,
      true,
    );
    assert.equal(
      (await db.query(`SELECT redeem_account_token('token','otherhash') AS ok`))
        .rows[0].ok,
      false,
    );
    assert.equal(
      Number((await db.query("SELECT count(*) FROM sessions")).rows[0].count),
      0,
    );
  } finally {
    await db.close();
  }
});
