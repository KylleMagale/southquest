import { Link } from "react-router-dom"
import { PageHeading, PageShell } from "../components/PageShell"
import { brand } from "../data/content"

const points = [
  { title: "Everything is ready", text: "Tents, gear and setup are done for you. You just show up and enjoy the outdoors." },
  { title: "Meals and extras", text: "Add meal options and extras when you book, and see the price update as you choose." },
  { title: "Book in minutes", text: "Pick a destination and package, choose your date, and get a booking reference right away." },
]

export default function AboutPage() {
  return (
    <PageShell title="About us">
      <PageHeading
        label="ABOUT US"
        first="ABOUT"
        accent="SOUTHQUEST"
        intro={`All-inclusive camping and glamping in ${brand.region}.`}
      />

      <div className="max-w-3xl mx-auto px-6">
        <p className="font-mono text-sm text-ink/70 leading-relaxed">
          {brand.first}
          {brand.second} Outdoor Escapes makes camping easy. We bring people to the mountains, beaches and waterfalls of{" "}
          {brand.region} without the hassle of buying gear or planning every detail. Choose a package, customize it, and
          book online.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {points.map((p) => (
            <div key={p.title} className="bg-ink text-white rounded-2xl p-6">
              <h2 className="font-black tracking-tight text-brand">{p.title}</h2>
              <p className="font-mono text-xs text-white/70 mt-2 leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link to="/packages" className="text-center bg-brand text-ink px-6 py-3.5 rounded-full font-bold text-sm">
            See packages
          </Link>
          <Link
            to="/contact"
            className="text-center border-2 border-ink px-6 py-3.5 rounded-full font-bold text-sm hover:bg-ink hover:text-white transition-colors"
          >
            Ask us a question
          </Link>
        </div>
      </div>
    </PageShell>
  )
}