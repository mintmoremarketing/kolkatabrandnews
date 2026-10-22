'use client'
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="not-found"><span className="label">SOMETHING INTERRUPTED THE ARCHIVE</span><h1>One more try.</h1><button onClick={reset}>Reload the archive ↗</button></section> }
