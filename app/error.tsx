"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="empty"><h1>Something went wrong</h1><p>The page could not be loaded. Your saved runs have not been cleared.</p><button className="button" onClick={reset}>Try again</button></div>; }
