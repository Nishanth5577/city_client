// ═══════════════════════════════════════════════════════════════
// Post-Processing v2 — Enhanced visual effects
// SSAO, Bloom, Vignette, BrightnessContrast, Tone Mapping
// ═══════════════════════════════════════════════════════════════
import { memo } from 'react';
import { EffectComposer, Bloom, SSAO, Vignette, ToneMapping, BrightnessContrast } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

const PostProcessingEffects = memo(function PostProcessingEffects({ enabled = true, renderMode }) {
  if (!enabled || renderMode === 'wireframe' || renderMode === 'xray') return null;

  return (
    <EffectComposer multisampling={4}>
      {/* SSAO — Tighter radius for realistic corner/crevice darkening */}
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={24}
        radius={3}
        intensity={28}
        luminanceInfluence={0.4}
        color="#000000"
      />

      {/* Bloom — Glass, metal, and light glow */}
      <Bloom
        intensity={0.25}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.4}
        mipmapBlur
      />

      {/* Brightness/Contrast — Slightly increased contrast for punch */}
      <BrightnessContrast
        brightness={0.02}
        contrast={0.08}
      />

      {/* Vignette — Cinematic edge darkening */}
      <Vignette
        offset={0.25}
        darkness={0.4}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* ACES Filmic Tone Mapping */}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
});

export default PostProcessingEffects;
