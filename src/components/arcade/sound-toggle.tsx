"use client";

import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { playSfx, setSoundOn, useSoundOn } from "@/lib/sfx";

import { PixelIcon } from "./icons";

/** Sound effects are off until the player turns them on. */
export function SoundToggle() {
  const copy = getMessages().arcade.sound;
  const on = useSoundOn();
  const label = on ? copy.on : copy.off;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={on}
      aria-label={copy.on}
      title={label}
      onClick={() => {
        setSoundOn(!on);
        if (!on) playSfx("click");
      }}
    >
      <PixelIcon name={on ? "soundOn" : "soundOff"} size={18} />
    </Button>
  );
}
