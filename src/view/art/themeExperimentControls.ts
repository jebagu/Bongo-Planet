import type { SphereView } from '../SphereView';
import capturedOriginal from '../../../assets/theme-experiment-original.json';
import { APPEARANCE_STORAGE_KEY, DEFAULT_APPEARANCE, validateAppearance, type Appearance } from './appearance';
import { ARCHIVED_LOOK_KEY, COMPLETE_THEMES, EXPERIMENT_LOOK_KEY, ORIGINAL_LOOK_KEY, PRODUCTION_ORIGINAL_LOOK_KEY, applyCompleteTheme, isArchivedThemePreset, refreshSavedTheme } from './completeThemes';
import { BACKDROPS, starPoints } from './swatches';
import { themeBackground } from './themePresentation';

function storedLook(key: string): Appearance | undefined {
  try { const value = localStorage.getItem(key); return value ? validateAppearance(JSON.parse(value)) : undefined; }
  catch { return undefined; }
}

/** The retained preview uses isolated saves; production uses the main appearance key. */
export function mountThemeExperiment(view: SphereView, message: (text: string) => void) {
  return mountWorldThemes(view, message, true);
}

export function mountWorldThemes(view: SphereView, message: (text: string) => void, experiment = false) {
  const originalKey = experiment ? ORIGINAL_LOOK_KEY : PRODUCTION_ORIGINAL_LOOK_KEY;
  const lookKey = experiment ? EXPERIMENT_LOOK_KEY : APPEARANCE_STORAGE_KEY;
  const mainLook = storedLook(APPEARANCE_STORAGE_KEY);
  const captured = storedLook(originalKey) ?? (mainLook?.theme ? undefined : mainLook) ?? validateAppearance(capturedOriginal);
  const original = validateAppearance({ ...captured, planet: DEFAULT_APPEARANCE.planet });
  try { localStorage.setItem(originalKey, JSON.stringify(original)); } catch { /* Session restoration still works. */ }
  const stored = storedLook(lookKey);
  const saved = experiment && stored && JSON.stringify(stored) === JSON.stringify(captured) ? original : stored;
  const retired = experiment && saved && isArchivedThemePreset(saved);
  if (retired) try { localStorage.setItem(ARCHIVED_LOOK_KEY, JSON.stringify(saved)); } catch { /* The source catalog also preserves these presets. */ }
  let appearance = retired ? structuredClone(original) : experiment && saved && JSON.stringify(saved) !== JSON.stringify(original) ? refreshSavedTheme(saved) : saved ?? structuredClone(original);
  const controls = document.createElement('section');
  controls.className = 'panel-section settings-controls theme-experiment-controls';
  controls.setAttribute('aria-labelledby', 'theme-title');
  controls.innerHTML = `<div class="section-heading"><h2 id="theme-title" class="section-title">Theme</h2></div>
    <label for="complete-theme" class="sr-only">World theme</label>
    <select id="complete-theme" class="panel-dropdown"><option value="original">Blue Marble</option>${COMPLETE_THEMES.map(theme => `<option value="${theme.id}">${theme.name}</option>`).join('')}<option value="custom" hidden>Imported look</option></select>`;
  document.querySelector('.settings-controls')!.replaceWith(controls);
  const sky = document.createElement('div'); sky.className = 'theme-sky-decoration'; sky.setAttribute('aria-hidden', 'true');
  const fireflies = document.createElement('div'); fireflies.className = 'theme-fireflies';
  for (let i = 0; i < 72; i++) {
    const spark = document.createElement('i');
    const x = (i * .61803398875 + .07) % 1, y = (i * .754877666 + .11) % 1;
    spark.style.cssText = `left:${x * 100}%;top:${y * 100}%;--drift-x:${Math.sin(i * 2.4) * 100}px;--drift-y:${-48 - (i % 5) * 20}px;--flight:${5 + i % 8}s;--flicker:${3 + i % 5}s;--delay:${-i * 1.73}s;--spark-size:${1.4 + i % 4 * .45}px`;
    fireflies.append(spark);
  }
  sky.append(fireflies);
  const stars = document.createElement('div'); stars.className = 'star-field'; stars.setAttribute('aria-hidden', 'true');
  for (const point of starPoints()) {
    const star = document.createElement('i');
    star.style.cssText = `left:${point.x}%;top:${point.y}%;width:${point.size}px;height:${point.size}px;opacity:${point.opacity}`;
    stars.append(star);
  }
  document.body.prepend(sky, stars);
  const root = document.documentElement;
  root.dataset.completeThemes = 'true';
  root.dataset.themeExperiment = String(experiment);
  const select = controls.querySelector<HTMLSelectElement>('#complete-theme')!;
  let storageWarned = false;
  function apply(next: Appearance, persist: boolean) {
    appearance = validateAppearance(next);
    view.setAppearance(appearance);
    const unchanged = JSON.stringify(appearance) === JSON.stringify(original);
    select.value = unchanged ? 'original' : COMPLETE_THEMES.find(theme => theme.id === appearance.theme?.id)?.id ?? 'custom';
    root.dataset.visualStyle = 'toys';
    root.dataset.backdrop = appearance.backdrop;
    root.dataset.completeTheme = unchanged ? 'original' : appearance.theme?.id ?? 'custom';
    const theme = appearance.theme;
    root.style.setProperty('--toy-sky', theme ? themeBackground(theme) : BACKDROPS.find(b => b.id === appearance.backdrop)!.fill);
    for (const [key, value] of Object.entries(theme?.interface ?? { accent: '#ad82ad', ink: '#2e2541', panel: '#fffaf0' })) root.style.setProperty(`--theme-${key}`, value);
    for (const key of ['planet', 'generator', 'note', 'beat', 'background', 'guitar', 'glass', 'kalimba', 'piano', 'marimba', 'bongo-high', 'bongo-low', 'kick', 'snare', 'hi-hat'] as const) root.style.setProperty(`--toy-${key}`, appearance[key]);
    sky.dataset.decoration = theme?.atmosphere.decoration ?? 'none';
    const hasStars = theme ? ['stars', 'nebula'].includes(theme.atmosphere.decoration) : appearance.backdrop.endsWith('stars');
    stars.style.display = hasStars ? 'block' : 'none';
    if (persist) try { localStorage.setItem(lookKey, JSON.stringify(appearance)); }
    catch { if (!storageWarned) message('This theme applies for this session. This browser could not save it.'); storageWarned = true; }
    document.dispatchEvent(new Event('bongo-theme-change'));
  }
  function choose(id: string) { apply(applyCompleteTheme(id, original), true); }
  select.onchange = () => choose(select.value);
  apply(appearance, !!stored && appearance !== stored);
  return { get: () => structuredClone(appearance), set: (next: Appearance) => apply(next, true) };
}
