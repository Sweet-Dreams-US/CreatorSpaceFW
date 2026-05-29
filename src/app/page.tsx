"use client";

import { useEffect, useState } from "react";
import Scene1Arrival from "@/components/scenes/Scene1Arrival";
import Scene3Landing from "@/components/scenes/Scene3Landing";
import Scene4NextEvent from "@/components/scenes/Scene4NextEvent";
import Scene5CommunityRiver from "@/components/scenes/Scene5CommunityRiver";
import Scene6Constellation from "@/components/scenes/Scene6Constellation";
// import SceneSocial from "@/components/scenes/SceneSocial";
import Scene8Close from "@/components/scenes/Scene8Close";
import SceneSpotlight from "@/components/scenes/SceneSpotlight";
import CommandPalette from "@/components/ui/CommandPalette";
import FloatingNav from "@/components/ui/FloatingNav";
import MobileNav from "@/components/ui/MobileNav";
import { getNextEvent } from "@/app/actions/events";

export default function Home() {
  const [nextEvent, setNextEvent] = useState<{
    id: string;
    title: string;
    date: string;
    location: string | null;
    facebook_url: string | null;
    max_capacity: number | null;
  } | null>(null);

  useEffect(() => {
    async function fetchNextEvent() {
      try {
        const data = await getNextEvent();
        if (data) {
          setNextEvent({
            id: data.id,
            title: data.title,
            date: data.date,
            location: data.location,
            facebook_url: data.facebook_url,
            max_capacity: data.max_capacity,
          });
        }
      } catch {
        // No upcoming event — Scene4NextEvent renders the "Event's Over" state
      }
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
        <SceneSpotlight />
        <Scene6Constellation />
        {/* <SceneSocial /> */}
        <Scene8Close />
      </main>
    </>
  );
}
