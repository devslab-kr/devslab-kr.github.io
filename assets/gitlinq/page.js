import { loadLatestRelease, RELEASE_PAGE } from './release.js';

const english = {
  skip: 'Skip to content', navFeatures: 'Features', navStart: 'Get started', navDownload: 'Download',
  heroA: 'New to Git.', heroB: 'Clear about changes.',
  lede: 'A Windows Git client for teams familiar with SVN. Find changes by author and title, then preview what undoing a change will do.',
  requirements: 'Windows x64 · Unsigned preview · WebView2 required',
  releaseLoading: 'Checking the latest release · Downloads are also available on the Release page.',
  exampleHint: 'Review and undo a change', exampleProject: 'Our team’s web service', exampleTitle: 'Change title', exampleAuthor: 'Author',
  exampleLater: 'Improve search result sorting', exampleSelected: 'Improve login guidance', exampleEarlier: 'Build the initial screen',
  exampleTeamA: 'Team A', exampleTeamB: 'Team B', examplePreview: 'Preview the selected undo', exampleBadge: 'Preview ready',
  exampleDescription: 'Review the change to undo and its impact on later changes.', examplePreserved: 'Later changes kept', exampleAction: 'Review undo result',
  exampleNote: 'An illustration of the workflow, not a screenshot of a real repository.',
  benefitOne: 'Changes organized by author and title', benefitTwo: 'Preview before undoing', benefitThree: 'Installer and portable ZIP',
  featuresTitle: 'Find it. Review it. Apply it.', featuresIntro: 'Keep the target and the outcome in view while you focus on the change that matters.',
  featureOneTitle: 'See who changed what', featureOneBody: 'Browse changes by author and title. Select the change you want to undo and confirm your target.',
  featureTwoTitle: 'Preview before you undo', featureTwoBody: 'Calculate the result first. After confirmation, create a new undo commit and verify the server result. Overlapping changes are flagged for manual resolution.',
  featureThreeTitle: 'Bring server changes to your PC', featureThreeBody: 'Review incoming changes, then update a clean working folder. Uncommitted edits or diverged changes stop the update with an explanation.',
  scopeTitle: 'In development', scopeBody: 'Everyday commits for new changes and editing conflicts inside the app are not available yet. This preview focuses on browsing changes, undoing changes, and updating from the server.',
  startTitle: 'Start with your own setup.', startOneTitle: 'Install it, or unzip it', startOneBody: 'The installer installs for the current Windows user. For the portable ZIP, extract the folder and run GitLinq.exe.',
  startTwoTitle: 'Git is detected automatically', startTwoBody: 'GitLinq looks for an installed Git. You can choose its executable in Settings or download Git within the app.',
  startThreeTitle: 'For PCs with limited connectivity', startThreeBody: 'Import a supported Git distribution ZIP in Settings. The GitLinq portable ZIP and a Git distribution ZIP are separate downloads.',
  beforeTitle: 'Before downloading', beforeRequirements: 'Windows x64 and Microsoft Edge WebView2 Runtime are required. WebView2 is not included in the portable ZIP.',
  beforeUnsigned: 'This preview is not code-signed. Windows may show an unknown publisher or SmartScreen warning. Check the release source and its SHA256 file before running it.',
  releaseLink: 'View release notes and verification files', sourceNotice: 'GitLinq product source is private. The public gitlinq-releases repository is for distribution: installers, ZIP files, and release information.',
  downloadTitle: 'Start with a clear view of changes.', downloadBody: 'Get the latest Windows x64 version from GitHub Releases.',
  footerHub: 'DevsLab projects', footerReleases: 'Public downloads repository',
};
const korean = Object.fromEntries([...document.querySelectorAll('[data-copy]')].map((element) => [element.dataset.copy, element.textContent]));
const copy = {
  ko: { title: 'GitLinq — SVN에 익숙한 팀을 위한 Windows Git 클라이언트', installer: 'Windows 설치 파일', portable: '무설치 ZIP', installerFallback: '설치 파일 · Release에서 받기', portableFallback: '무설치 ZIP · Release에서 받기', ready: '최신 배포', fallback: '다운로드는 GitHub Release 페이지에서 확인하세요.', partial: '일부 파일은 Release 페이지에서 확인하세요.' },
  en: { title: 'GitLinq — A Windows Git client for teams familiar with SVN', installer: 'Windows installer', portable: 'Portable ZIP', installerFallback: 'Installer · View release', portableFallback: 'Portable ZIP · View release', ready: 'Latest release', fallback: 'Find downloads on the GitHub Release page.', partial: 'Some downloads are available through the Release page.' },
};
let language = 'ko';
let release = null;
const picker = document.getElementById('lang-picker');

function renderDownloads() {
  const text = copy[language];
  for (const kind of ['installer', 'portable']) {
    for (const element of document.querySelectorAll(`[data-download="${kind}"]`)) element.href = release?.[kind] || RELEASE_PAGE;
    for (const element of document.querySelectorAll(`[data-download-label="${kind}"]`)) element.textContent = text[release?.[kind] ? kind : `${kind}Fallback`];
  }
  if (release) {
    const status = document.getElementById('release-status');
    status.textContent = release.version
      ? `${text.ready} · v${release.version}${release.installer && release.portable ? '' : ` · ${text.partial}`}`
      : text.fallback;
  }
}

function applyLanguage(next, persist = false) {
  if (!copy[next]) return;
  language = next;
  document.documentElement.lang = next;
  document.documentElement.dir = 'ltr';
  document.title = copy[next].title;
  for (const element of document.querySelectorAll('[data-copy]')) element.textContent = (next === 'ko' ? korean : english)[element.dataset.copy];
  document.getElementById('lang-current').textContent = next.toUpperCase();
  for (const button of picker.querySelectorAll('[data-lang]')) button.setAttribute('aria-pressed', String(button.dataset.lang === next));
  if (persist) { try { localStorage.setItem('hub-lang', next); } catch {} }
  renderDownloads();
}

let saved = null;
try { saved = localStorage.getItem('hub-lang'); } catch {}
// Keep the hub's other language preferences intact; this product page currently supports Korean and English.
applyLanguage(saved === 'ko' ? 'ko' : saved ? 'en' : navigator.language?.toLowerCase().startsWith('ko') ? 'ko' : 'en');
picker.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-lang]');
  if (!button) return;
  applyLanguage(button.dataset.lang, true);
  picker.open = false;
  picker.querySelector('summary').focus();
});
document.addEventListener('click', (event) => { if (!picker.contains(event.target)) picker.open = false; });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && picker.open) { picker.open = false; picker.querySelector('summary').focus(); } });
document.getElementById('theme-toggle').addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}
});
loadLatestRelease().then((result) => { release = result; renderDownloads(); });
