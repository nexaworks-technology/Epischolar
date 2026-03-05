"use client";

import { Button } from "@heroui/react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg font-sans p-8">
      <main className="flex w-full max-w-4xl flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-xl border border-brand-bot/50 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6">
          Epischolar
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl">
          The Self-Building University Service & Ivy-Grade SOP Generator.
        </p>

        <div className="flex gap-4">
          <Link href="/wizard">
            <Button 
              className="bg-brand-primary hover:bg-brand-hover text-white font-semibold py-6 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
              size="lg"
            >
              Start Discovery Interview
            </Button>
          </Link>
          <Button 
            variant="flat"
            className="bg-brand-bot text-brand-primary font-semibold py-6 px-8 rounded-full transition-transform transform hover:scale-105"
            size="lg"
          >
            Learn More
          </Button>
        </div>
      </main>
    </div>
  );
}
