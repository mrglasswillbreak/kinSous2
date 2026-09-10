import Link from "next/link";
export default function VideoPage() {
  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold">Stay connected through messages</h1>
      <p className="text-muted my-4">
        Audio and video calling are not available yet. Coordinate your order in
        your private conversation.
      </p>
      <Link className="text-primary font-semibold" href="/messages">
        Open messages ?
      </Link>
    </div>
  );
}
