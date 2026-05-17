"use client";

import { motion } from "framer-motion";

const stats = [
  { label: "Academic Honor", value: "Magna Cum Laude" },
  { label: "Student Leadership", value: "3 Years SSG" },
  { label: "Freelance System", value: "Solo Developer" },
  { label: "Degree Distinction", value: "Dean's Lister" },
];

export default function About() {
  return (
    <section id="about" className="py-16 md:py-32 flex justify-center" suppressHydrationWarning>
      <div className="w-full max-w-[860px] px-6" suppressHydrationWarning>
        <header className="mb-12">
          <span className="text-[11px] uppercase tracking-[0.12em] text-text-muted font-bold">About</span>
        </header>

        <div className="grid md:grid-cols-2 gap-10 md:gap-20">
          <div className="space-y-6 text-text-secondary leading-[1.8] text-sm">
            <p>
              I am a <span className="text-text-primary font-medium">BS Information Technology</span> graduate from Central Philippine State University, graduating with the distinction of <span className="text-text-primary font-medium">Magna Cum Laude</span>. 
            </p>
            <p>
              My background is rooted in self-driven development and strong student leadership. I spent <span className="text-text-primary font-medium">three years in the Supreme Student Government (SSG)</span>, where I served as Floor Leader, honing my communication and collaborative skills.
            </p>
            <p>
              I specialize in the entire development lifecycle—from gathering requirements directly with stakeholders to architecting robust back-ends and crafting high-fidelity user experiences. My focus is on delivering practical, user-centered solutions that solve real-world problems.
            </p>
            <p className="italic">
              Currently open for freelance web and mobile development projects, as well as full-time opportunities where I can contribute my modern approach to software engineering and commitment to building high-quality, functional systems.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ x: 4 }}
                className="group p-6 rounded-2xl bg-surface border border-border transition-all duration-300"
              >
                <div className="text-2xl font-light tracking-tight text-text-primary mb-1">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted group-hover:text-text-secondary transition-colors">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

