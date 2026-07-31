"use client";

import AppSidebar from "@/app/_components/global/AppSidebar";
import { AssistantSidebar } from "@/app/_components/global/AssistantSidebar";
import { useState } from "react";

export default function SidebarLayout({
  children,
  navbar,
}: {
  children: React.ReactNode;
  navbar: React.ReactNode;
}) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white overflow-x-hidden max-w-[100vw]">
      <AppSidebar onAssistantClick={() => setIsAssistantOpen(true)} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0 lg:ml-64">
        {navbar}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
      <AssistantSidebar
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
}
