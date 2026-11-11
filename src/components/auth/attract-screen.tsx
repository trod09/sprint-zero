/**
 * The left half of the sign-in page: an arcade attract screen. A night sky
 * over the worlds' landscape, Kanbo, the title, a parade of every world and
 * a blinking "press start". Always dark, like the world banners, in both
 * themes, so its colors are fixed.
 */
import { Mascot, ModuleSprite, moduleColor } from "@/components/arcade/icons";
import { ModuleScene } from "@/components/arcade/module-banner";
import { getMessages } from "@/i18n";

export function AttractScreen({
  worlds,
  cases,
  skills,
}: {
  worlds: readonly { id: string; name: string }[];
  cases: number;
  skills: number;
}) {
  const messages = getMessages();
  const copy = messages.auth.attract;
  return (
    <section
      aria-labelledby="attract-title"
      className="border-frame shadow-pixel-lg relative isolate flex min-h-[34rem] flex-col overflow-hidden rounded-md border-2 bg-[#0a0e1f] text-[#eef1ff]"
    >
      {/* Landscape: three worlds' skylines layered for depth. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <ModuleScene
          moduleId="ab-test"
          className="absolute inset-x-0 bottom-0 h-3/4 w-full opacity-40"
        />
        <ModuleScene
          moduleId="metric-drop"
          className="absolute inset-x-0 bottom-0 h-1/2 w-full opacity-60"
        />
        <ModuleScene
          moduleId="backlog"
          className="absolute inset-x-0 bottom-0 h-1/3 w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1f] via-[#0a0e1f]/70 to-transparent" />
        {/* Scanlines, like an old screen. */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_3px,rgba(255,255,255,0.03)_3px,rgba(255,255,255,0.03)_4px)]" />
      </div>

      <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
        <div>
          <p className="font-pixel text-sm tracking-widest text-[#ffd23f] uppercase">
            {copy.eyebrow}
          </p>
          <h1
            id="attract-title"
            className="font-pixel mt-2 text-5xl leading-none [text-shadow:4px_4px_0_#000] sm:text-6xl"
          >
            {messages.app.name}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#c9cfee] [text-shadow:1px_1px_0_#000]">
            {copy.tagline}
          </p>
        </div>

        <div className="flex items-end gap-4">
          <Mascot size={112} title={messages.arcade.mascotAlt} />
          <p className="relative mb-10 rounded-md border-2 border-[#5f6db0] bg-[#141a36] px-3 py-2 text-sm shadow-[3px_3px_0_0_#000]">
            {copy.kanbo}
            <span
              aria-hidden="true"
              className="absolute -bottom-2 left-4 size-3 rotate-45 border-r-2 border-b-2 border-[#5f6db0] bg-[#141a36]"
            />
          </p>
        </div>

        <div className="mt-auto space-y-4 rounded-md border-2 border-[#5f6db0]/70 bg-[#0a0e1f]/85 p-4 shadow-[3px_3px_0_0_#000]">
          <div>
            <p className="font-pixel text-xs tracking-widest text-[#c9cfee] uppercase">
              {copy.worlds}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {worlds.map((world, index) => (
                <li
                  key={world.id}
                  title={world.name}
                  className="animate-pixel-pop rounded-sm border-2 bg-[#0a0e1f]/80 p-1.5"
                  style={{
                    borderColor: moduleColor(world.id),
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  <ModuleSprite moduleId={world.id} size={22} />
                  <span className="sr-only">{world.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#5f6db0]/60 pt-3">
            <p className="font-pixel text-sm tabular-nums">
              {copy.stats(cases, worlds.length, skills)}
            </p>
            <p
              aria-hidden="true"
              className="font-pixel animate-pixel-blink text-lg tracking-widest text-[#ffd23f] [text-shadow:2px_2px_0_#000]"
            >
              ▶ {copy.pressStart}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
