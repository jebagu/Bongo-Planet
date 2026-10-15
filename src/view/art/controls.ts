import type { SphereView } from '../SphereView';
import { isThemeExperiment } from './completeThemes';
import { mountWorldThemes } from './themeExperimentControls';

/** All approved world themes are available in the production game and isolated preview. */
export function mountAppearance(view: SphereView, message: (text: string) => void) {
  return mountWorldThemes(view, message, isThemeExperiment(location.pathname, location.search));
}
