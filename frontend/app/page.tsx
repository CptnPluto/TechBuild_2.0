import { Metadata } from 'next';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  CpuChipIcon, 
  ChartBarIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Dashboard - TechBuild 2.0',
  description: 'Construction takeoff dashboard with AI-powered document processing'
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              TechBuild 2.0
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              Advanced construction takeoff platform powered by Landing.AI. 
              Process door schedules, hardware data, and construction documents with precision and speed.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/dashboard"
                className="btn-primary"
              >
                Get Started
              </Link>
              <Link
                href="/takeoff"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Upload Documents <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">
              Powered by Landing.AI
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for construction takeoff
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform uses advanced AI to automatically extract door schedules, 
              hardware data, and other construction information from your documents.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <DocumentTextIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Door Schedule Extraction
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Automatically extract door schedules from PDF documents with high accuracy using Landing.AI's 
                  advanced document processing capabilities.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <CpuChipIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Hardware Data Processing
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Extract hardware specifications, quantities, and part numbers from construction 
                  documents with precision and speed.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Real-time Analytics
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Monitor processing status, confidence scores, and extraction quality with 
                  comprehensive analytics and reporting.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                    <ClockIcon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  Fast Processing
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Process documents in seconds, not hours. Landing.AI's optimized models 
                  deliver results quickly while maintaining accuracy.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to streamline your takeoff process?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-200">
              Start processing your construction documents with AI-powered precision today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/dashboard"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started
              </Link>
              <Link
                href="/takeoff"
                className="text-sm font-semibold leading-6 text-white"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}