import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is Fake My Run?",
    answer:
      "Fake My Run is a free tool that lets you draw custom running routes on a map and generate realistic GPX files. You can configure pace, elevation gain, and variability to create authentic-looking activities for Strava, Garmin, and other fitness apps.",
  },
  {
    question: "How do I create a fake run?",
    answer:
      "Search for a location, then either draw a route manually or use shape templates (circle, heart) to generate a route automatically. Adjust your pace, distance, and elevation settings, then download the GPX file.",
  },
  {
    question: "How do I upload a GPX file to Strava?",
    answer:
      'Log in to Strava, click the "+" icon in the top navigation, select "Upload activity," then choose your downloaded .gpx file. Add a name and activity type, then save. Your fake run will appear in your feed.',
  },
  {
    question: "Is Fake My Run free?",
    answer:
      "Yes, completely free. No tokens, no subscriptions, no account required. Just draw your route and download the GPX file.",
  },
  {
    question: "What makes the generated GPX files realistic?",
    answer:
      "The tool snaps routes to real roads, uses actual terrain elevation data, and adds pace variability so the activity doesn't look artificially uniform. Timestamps are calculated based on your configured pace.",
  },
  {
    question: "What fitness apps are supported?",
    answer:
      "Any app that accepts GPX files — including Strava, Garmin Connect, Nike Run Club, Adidas Running, Komoot, and more.",
  },
  {
    question: "Does the route snap to real roads?",
    answer:
      'Yes. The "Align Path to Road" feature automatically snaps your drawn route to actual streets and paths, making the result look like a real run.',
  },
  {
    question: "Can I draw heart or circle shaped routes?",
    answer:
      "Yes! The app includes shape templates for circles and hearts. Just select a shape from the Draw Tool panel and it will generate the route automatically based on your current map view.",
  },
  {
    question: "Can I create routes anywhere in the world?",
    answer:
      "Yes. Search for any city, neighborhood, or landmark and draw your route there. The tool works with global map data, so you can generate fake runs in any location worldwide.",
  },
  {
    question: "What is a GPX file?",
    answer:
      "GPX (GPS Exchange Format) is a standard file format for storing GPS data like routes, tracks, and waypoints. It's universally supported by fitness apps including Strava, Garmin Connect, and Nike Run Club for importing activities.",
  },
  {
    question: "Will my fake run look real on Strava?",
    answer:
      "Yes. The generated GPX includes realistic pace variations, accurate elevation data from real terrain, and proper timestamps. The route follows actual roads and paths, making it indistinguishable from a real recorded activity.",
  },
  {
    question: "Can I customize the pace and distance?",
    answer:
      "Absolutely. Use the pace slider to set your target speed (in min/km), adjust pace variability to add natural fluctuations, and draw any route length you want. The tool calculates realistic split times automatically.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. Fake My Run works entirely in your browser with no sign-up, no login, and no personal data collected. Just open the app and start drawing your route.",
  },
  {
    question: "How do I upload a GPX file to Garmin Connect?",
    answer:
      'Log in to Garmin Connect, go to Activities, click "Import" in the top right, then select your .gpx file. Garmin will process it and add it to your activity history with all the route and pace data.',
  },
];

export function FAQ() {
  const midpoint = Math.ceil(faqs.length / 2);
  const leftColumn = faqs.slice(0, midpoint);
  const rightColumn = faqs.slice(midpoint);

  return (
    <section className="w-full bg-white py-32 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-500 mb-10">
          Everything you need to know about generating fake GPX running routes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <Accordion.Root type="multiple" className="space-y-3">
            {leftColumn.map((faq, index) => (
              <Accordion.Item
                key={index}
                value={`faq-${index}`}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="w-full flex items-center justify-between px-6 py-4 text-left text-gray-900 font-medium hover:bg-gray-50 transition-colors cursor-pointer group">
                    <span>{faq.question}</span>
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                  <p className="px-6 pb-4 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>

          <Accordion.Root type="multiple" className="space-y-3">
            {rightColumn.map((faq, index) => (
              <Accordion.Item
                key={index}
                value={`faq-right-${index}`}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="w-full flex items-center justify-between px-6 py-4 text-left text-gray-900 font-medium hover:bg-gray-50 transition-colors cursor-pointer group">
                    <span>{faq.question}</span>
                    <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                  <p className="px-6 pb-4 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </div>
    </section>
  );
}
