"use client";

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

export default function Home() {
  return (
    <>
      <CommandPalette />
      <FloatingNav />
      <MobileNav />
      <main>
        <Scene1Arrival />
        <Scene3Landing />
        <Scene5CommunityRiver />
        <Scene4NextEvent />
        <Scene6Constellation />
        {/* <SceneSocial /> */}
        <Scene8Close />
      </main>
    </>
  );
}
