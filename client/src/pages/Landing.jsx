import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Code2, Zap, Users, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import Navbar from '../components/landing/Navbar.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';

const features = [
  { icon: Video, title: 'HD Video Calls', desc: 'Low-latency WebRTC video with screen sharing and adaptive layouts.' },
  { icon: Code2, title: 'Live Code Editor', desc: 'Monaco-powered editor synced in real time across every participant.' },
  { icon: Zap, title: 'Instant Execution', desc: 'Run code in 8+ languages and see output, time, and memory instantly.' },
  { icon: MessageSquare, title: 'Built-in Chat', desc: 'Discuss without leaving the room, with typing indicators and history.' },
  { icon: Users, title: 'Multi-Participant', desc: 'Bring your whole team into a single collaborative session.' },
  { icon: ShieldCheck, title: 'Secure by Default', desc: 'JWT auth, HTTP-only cookies, and encrypted signalling throughout.' },
];

const steps = [
  { step: '01', title: 'Create a room', desc: 'Spin up a meeting in one click and share the link with your team.' },
  { step: '02', title: 'Join & connect', desc: 'Participants join instantly with camera, mic, and editor in sync.' },
  { step: '03', title: 'Build together', desc: 'Write, run, and debug code live while talking it through on video.' },
];

const stats = [
  { value: '10k+', label: 'Sessions hosted' },
  { value: '8', label: 'Languages supported' },
  { value: '<150ms', label: 'Editor sync latency' },
  { value: '99.9%', label: 'Uptime' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_60%)]" />
        <div className="mx-auto max-w-3xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-secondary"
          >
            Now with real-time collaborative execution
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-6 text-4xl font-semibold tracking-tight text-text sm:text-5xl"
          >
            Code together. Talk it through.{' '}
            <span className="text-primary">Ship faster.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-5 max-w-xl text-base text-text-secondary"
          >
            CodeMeet combines video conferencing with a real-time collaborative editor and
            instant code execution — built for pair programming, interviews, and remote teams.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Link to="/register">
              <Button size="lg">
                Start for free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">Log in</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section id="features" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-semibold text-text sm:text-3xl">Everything you need to collaborate</h2>
            <p className="mt-3 text-sm text-text-secondary">
              A focused toolset for engineering conversations — nothing bolted on, nothing missing.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-text">{title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border/60 bg-surface/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-text sm:text-3xl">How it works</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step}>
                <span className="text-sm font-semibold text-primary">{s.step}</span>
                <h3 className="mt-2 text-base font-semibold text-text">{s.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stats" className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 text-center sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-semibold text-text sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <Card className="mx-auto flex max-w-4xl flex-col items-center gap-4 p-10 text-center">
          <h2 className="text-2xl font-semibold text-text">Ready to pair program smarter?</h2>
          <p className="max-w-md text-sm text-text-secondary">
            Create your first room in under a minute — no downloads, no setup.
          </p>
          <Link to="/register">
            <Button size="lg">
              Create free account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </section>

      <footer className="border-t border-border/60 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-text-muted sm:flex-row">
          <span className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" /> CodeMeet
          </span>
          <span>© {new Date().getFullYear()} CodeMeet. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
