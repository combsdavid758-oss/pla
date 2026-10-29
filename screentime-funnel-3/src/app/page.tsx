"use client";

import dynamic from "next/dynamic";

// Client-only render: the funnel reads ?fast=… from the URL during its first
// render, which is only possible without SSR. Everything inside is a client
// component anyway (state machine, wheel picker, timers).
const Funnel = dynamic(() => import("@/components/funnel"), { ssr: false });

export default function Home() {
  return <Funnel />;
}
