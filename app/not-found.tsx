import Link from "next/link";
export default function NotFound() { return <div className="empty"><h1>Page not found</h1><p>Return to the evaluation workspace.</p><Link className="button" href="/">Go to overview</Link></div>; }
