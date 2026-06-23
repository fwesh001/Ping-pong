"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-brand-cyan font-bold text-lg mb-4">ping-pong</h3>
            <p className="text-sm text-slate-400">
              Simple, reliable uptime monitoring for your web services.
            </p>
          </div>

          {/* Help & Support */}
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">Help</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help/getting-started"
                  className="text-sm hover:text-slate-100 transition-colors"
                >
                  Getting Started
                </Link>
              </li>
              <li>
                <Link
                  href="/help/docs"
                  className="text-sm hover:text-slate-100 transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/help/faq"
                  className="text-sm hover:text-slate-100 transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@ping-pong.io"
                  className="text-sm hover:text-slate-100 transition-colors"
                >
                  Support Email
                </a>
              </li>
              <li>
                <Link
                  href="/feedback"
                  className="text-sm hover:text-slate-100 transition-colors"
                >
                  Send Feedback
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm hover:text-slate-100 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Developer */}
          <div>
            <h4 className="text-slate-100 font-semibold mb-4">Developer</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/api-docs"
                  className="text-sm hover:text-slate-100 transition-colors"
                >
                  API Documentation
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/ping-pong"
                  className="text-sm hover:text-slate-100 transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-sm hover:text-slate-100 transition-colors"
                >
                  Status Page
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8">
          <p className="text-sm text-slate-400 text-center">
            &copy; 2026 ping-pong. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
