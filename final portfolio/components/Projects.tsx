"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const projects = [
  {
    name: "Pulupandan Water District System",
    type: "Web Application",
    year: "2025 - 2026",
    desc: "Freelance solo developer project consisting of a mobile-responsive Reader App, Admin Dashboard, and Cashier Dashboard. Client expressed intent to purchase for continued operational use.",
    link: null,
    category: "actual",
    images: ["/pr/water.jpg"],
  },
  {
    name: "NORTH",
    type: "Web Application",
    year: "2026",
    desc: "AI-powered web app that maps a user's skills and surfaces relevant income and career paths with integrated decision logic.",
    link: "https://north-wana.vercel.app/",
    category: "actual",
    images: ["/pics/north-1.png", "/pics/north-2.png", "/pics/north-3.png"],
  },
  {
    name: "Alter",
    type: "AI Chat Platform",
    year: "2025–26",
    desc: "Creative AI chat application simulating conversations with alternate versions of the user, featuring timeline branching logic.",
    link: "https://alter-crm.vercel.app/",
    category: "side",
    images: ["/pics/alter-1.png", "/pics/alter-2.png", "/pics/alter-3.png"],
  },
  {
    name: "DRIFT",
    type: "Spatial Audio",
    year: "2026",
    desc: "High-fidelity spatial web experience for curating sound and visual aesthetics with immersive UI design.",
    link: "https://drift-v1.vercel.app/",
    category: "side",
    images: ["/pics/drift-1.png", "/pics/drift-2.png", "/pics/drift-3.png"],
  },
  {
    name: "Dreamly",
    type: "Mobile AI",
    year: "2025–26",
    desc: "AI-driven story maker for children designed with a kid-friendly UI focused on engagement and safety.",
    link: null,
    category: "actual",
    images: ["/pics/dreamly-1.jpg", "/pics/dreamly-2.jpg", "/pics/dreamly-3.jpg"],
  },
  {
    name: "After Midnight",
    type: "Mobile Application",
    year: "2024 - 2026",
    desc: "Developed a unique mobile app that only unlocks between 12:00 AM and 4:00 AM for distraction-free journaling, late-night thought release, and time-locked access control.",
    link: "https://after-midnight-crm.vercel.app/",
    category: "side",
    images: ["/pr/after-midnight.jpg"],
  },
  {
    name: "Tindadone",
    type: "Mobile Application",
    year: "2026 (In Progress)",
    desc: "Full POS mobile app designed for diverse retail stores (food, hardware, sari-sari) featuring stock management, credit tracking, and expense monitoring.",
    link: null,
    wip: true,
    category: "actual",
    images: ["/pics/tindadone-1.jpg", "/pics/tindadone-2.jpg", "/pics/tindadone-3.jpg"],
  },
];



const ProjectContent = ({ project }: { project: any }) => (
  <>
    <div className="flex-1 min-w-0 pr-8">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-lg font-medium text-text-primary tracking-tight">{project.name}</h3>
        <span className="px-2 py-0.5 rounded-full bg-surface border border-border text-[10px] uppercase tracking-wider text-text-muted">
          {project.type}
        </span>
        {project.wip && (
          <span className="px-2 py-0.5 rounded-full bg-text-primary/5 text-text-primary text-[10px] font-medium uppercase tracking-wider">
            WIP
          </span>
        )}
      </div>
      <p className="text-sm text-text-secondary leading-relaxed max-w-md">
        {project.desc}
      </p>
    </div>

    <div className="flex items-center gap-8 mt-4 sm:mt-0">
      <span className="text-xs font-medium text-text-muted font-mono">{project.year}</span>
      <div className="w-10 flex justify-end">
        {project.link ? (
          <div className="p-2 rounded-full hover:bg-surface transition-colors group/link">
            <ArrowUpRight 
              size={18} 
              className="text-text-muted group-hover/link:text-text-primary transition-all group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" 
            />
          </div>
        ) : (
          <div className="w-10 h-10" />
        )}
      </div>
    </div>
  </>
);

const FloatingCarousel = ({ images, mousePos }: { images: string[], mousePos: { x: number, y: number } }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  useEffect(() => {
    if (!images || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) return null;

  return (
    <motion.div
      className="fixed pointer-events-none z-[100] hidden md:flex items-center justify-center"
      style={{
        left: mousePos.x,
        top: mousePos.y,
        transform: "translate(220px, -50%)",
      }}
    >
      <div className="relative flex items-center justify-center">
        <AnimatePresence>
          {images.map((img, i) => {
            const offset = (i - activeIndex + images.length) % images.length;
            
            let rotate = 0;
            let translateX = 0;
            let zIndex = 30;
            let scale = 1;
            let opacity = 1;
            let filter = "blur(0px) brightness(1)";
            
            // Fanned scatter effect
            if (images.length === 3) {
              if (offset === 0) {
                rotate = 0; translateX = 0; zIndex = 30; scale = 1; opacity = 1; filter = "blur(0px) brightness(1)";
              } else if (offset === 1) {
                rotate = 8; translateX = 40; zIndex = 20; scale = 0.9; opacity = 0.9; filter = "blur(3px) brightness(0.4)";
              } else if (offset === 2) {
                rotate = -8; translateX = -40; zIndex = 10; scale = 0.9; opacity = 0.9; filter = "blur(3px) brightness(0.4)";
              }
            } else {
              // Fallback for single image
              if (offset !== 0) opacity = 0;
            }

            return (
              <motion.img
                key={img}
                src={img}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ rotate, x: translateX, zIndex, scale, opacity, filter }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 220, damping: 25 }}
                className="absolute w-auto h-auto max-w-[320px] max-h-[380px] rounded-2xl shadow-2xl shadow-black/80 border border-white/10 bg-background"
              />
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};


export default function Projects() {
  const [filter, setFilter] = useState<"actual" | "side">("actual");
  const [hoveredImages, setHoveredImages] = useState<string[] | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (images: string[] | undefined) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredImages(images || null);
    }, 2000); // Wait 2 seconds before showing
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredImages(null);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const filteredProjects = projects.filter((p) => p.category === filter);

  return (
    <section id="projects" className="py-16 md:py-24 flex justify-center" suppressHydrationWarning>
      <div className="w-full max-w-[860px] px-6" suppressHydrationWarning>
        <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <span className="text-[11px] uppercase tracking-[0.12em] text-text-muted font-medium">Projects</span>
          
          <div className="relative flex p-1 bg-surface border border-border rounded-full w-fit">
            <button
              onClick={() => setFilter("actual")}
              className={`relative px-6 py-2 text-[11px] font-medium transition-colors duration-300 min-w-[120px] ${
                filter === "actual" ? "text-background" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {filter === "actual" && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-text-primary rounded-full z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Actual Projects</span>
            </button>
            <button
              onClick={() => setFilter("side")}
              className={`relative px-6 py-2 text-[11px] font-medium transition-colors duration-300 min-w-[140px] ${
                filter === "side" ? "text-background" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {filter === "side" && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-text-primary rounded-full z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Side Projects / Fun</span>
            </button>
          </div>
        </header>

        <div className="space-y-0 border-t border-border min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {filteredProjects.map((project, i) => (
                <motion.div
                  key={project.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="group relative"
                  onMouseEnter={() => handleMouseEnter(project.images)}
                  onMouseLeave={handleMouseLeave}
                >
                  {project.link ? (
                    <a 
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col sm:flex-row sm:items-center justify-between py-10 px-0 border-b border-border transition-all duration-300 group-hover:px-4 hover:bg-surface/50 cursor-none"
                    >
                      <ProjectContent project={project} />
                    </a>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-10 px-0 border-b border-border transition-all duration-300 group-hover:px-4">
                      <ProjectContent project={project} />
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <footer className="mt-12">
          <p className="text-xs text-text-muted">
            More projects available on GitHub.
          </p>
        </footer>
      </div>

      {/* Floating Image Reveal Carousel */}
      <AnimatePresence>
        {hoveredImages && hoveredImages.length > 0 && (
          <FloatingCarousel images={hoveredImages} mousePos={mousePos} />
        )}
      </AnimatePresence>
    </section>
  );
}

