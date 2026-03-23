"use client";

import { useEffect, useState } from "react";
import Scene1Arrival from "@/components/scenes/Scene1Arrival";
import Scene3Landing from "@/components/scenes/Scene3Landing";
import Scene4NextEvent from "@/components/scenes/Scene4NextEvent";
import Scene5CommunityRiver from "@/components/scenes/Scene5CommunityRiver";
import Scene6Constellation from "@/components/scenes/Scene6Constellation";
// import SceneSocial from "@/components/scenes/SceneSocial";
import Scene8Close from "@/components/scenes/Scene8Close";
import CommandPalette from "@/components/ui/CommandPalette";
import FloatingNav from "@/components/ui/FloatingNav";
import MobileNav from "@/components/ui/MobileNav";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const [nextEvent, setNextEvent] = useState<{
    id: string;
    title: string;
    date: string;
    location: string | null;
    facebook_url: string | null;
  } | null>(null);

  useEffect(() => {
    async function fetchNextEvent() {
      const supabase = createClient();
      const { data } = await supabase
        .from("events")
        .select("id, title, date, location, facebook_url")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(1)
        .single();
      if (data) setNextEvent(data);
    }
    fetchNextEvent();
  }, []);

  return (
    <>
      <CommandPalette />
      <FloatingNav />
      <MobileNav />
      <main>
        <Scene1Arrival />
        <Scene3Landing />
        <Scene5CommunityRiver />
        <Scene4NextEvent dbEvent={nextEvent} />
        <Scene6Constellation />
        {/* <SceneSocial /> */}
        <Scene8Close />
      </main>
    </>
  );
}
