"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/ui/FAQ";

export default function LandingPage() {
  return (
    <>
      <Navbar creditBalance={0} />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Monitor Your Services, Stay Always Online
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              ping-pong is a simple, reliable uptime monitoring platform. Track
              the health of your web services with automatic pings and real-time
              insights.
            </p>
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="card text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4">Register & Setup</h3>
                <p className="text-gray-600">
                  Sign up and configure the URLs you want to monitor. Choose your
                  ping frequency and start tracking.
                </p>
              </div>

              {/* Step 2 */}
              <div className="card text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4">Automatic Pings</h3>
                <p className="text-gray-600">
                  Our cron engine automatically pings your services at your chosen
                  intervals, tracking uptime and response times.
                </p>
              </div>

              {/* Step 3 */}
              <div className="card text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4">Stay Informed</h3>
                <p className="text-gray-600">
                  View real-time status, historical uptime data, and get insights
                  into your service reliability.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Overview */}
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Powerful Features
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Multiple Monitors</h3>
                  <p className="text-gray-600">
                    Monitor unlimited web services from one dashboard.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Credit System</h3>
                  <p className="text-gray-600">
                    Flexible credit-based pricing for scalable monitoring.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Uptime History</h3>
                  <p className="text-gray-600">
                    Track uptime percentages and response times over time.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                    ✓
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Daily Check-ins</h3>
                  <p className="text-gray-600">
                    Earn free credits every day through the daily check-in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join hundreds of teams monitoring their services with ping-pong.
            </p>
            <Link href="/dashboard" className="btn-primary text-lg px-8 py-3">
              Start Free Today
            </Link>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <FAQ />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
