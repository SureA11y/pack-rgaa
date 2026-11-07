/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-video-captions-track-kind
 * @atomic true
 * @summary A video's caption track must use kind="captions"
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <video> elements with at least one <track> child with a
 *   non-empty src carrying text for the video: kind="subtitles",
 *   kind="captions", no kind at all, which HTML reads as subtitles, or a
 *   kind HTML does not know (kind="caption"), which it reads as metadata. A
 *   track with no src delivers nothing and is ignored. A page with none is
 *   notApplicable.
 * @expectation
 *   At least one of those tracks has kind="captions" (RGAA 4.3.2). When
 *   the only tracks are subtitles:
 *   - fail when a track has a kind HTML does not know, such as
 *     kind="caption": HTML makes it metadata, which is never shown;
 *   - fail when a subtitles track has a srclang in the language of the
 *     video, as the lang attribute of the <video> itself gives it (primary
 *     subtag), or a label that names captions (« sourds et malentendants »,
 *     SME, SDH, CC): it is captions that do not say so;
 *   - cantTell otherwise: the track may be a translation, which is not a
 *     caption track (glossary « Sous-titres synchronisés », note 2), and
 *     then 4.3.2 does not apply and the question is 4.3.1's. The page's
 *     language is no evidence of the audio's: an English talk with French
 *     subtitles on a French page is a translation.
 * @implementation-notes
 * - Opt-in (tag `rgaa`): WCAG does not ask for a particular kind value, so
 *   the rule runs only under the rgaa-4.1.2 profile, the `rgaa` tag or its
 *   own id.
 * - Tracks of kind chapters, descriptions or metadata are ignored. Whether
 *   the video needs captions at all, and whether they are relevant, stays
 *   with RGAA 4.3.1 and 4.4.1.
 */

const id = 'rgaa-video-captions-track-kind';

const meta = {
  title: 'Video caption tracks use kind="captions"',
  description:
    'Checks that a <video> with text tracks has at least one <track kind="captions">, not only subtitles, and asks when its subtitles may be translations.',
  i18n: {
    titleKey: 'videoCaptionsTrackKind_title',
    descriptionKey: 'videoCaptionsTrackKind_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'media', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['noCaptionsKind', 'subtitlesMayBeTranslation', 'invalidKind'],
  review: {
    subtitlesMayBeTranslation: {
      steps: [
        'Find the video the report names, and note the language spoken in it.',
        'Turn on each of its subtitles tracks in the player and watch a passage with dialogue and sounds.',
        'Check whether a track is in the language of the video and gives who speaks and the sounds that matter, which makes it captions.'
      ],
      passWhen:
        'Every subtitles track is a translation into another language, and captions are provided some other way, so the tracks need no kind="captions".',
      failWhen:
        'A track carries the captions of the video in its own language but is marked kind="subtitles" (or has no kind), which fails RGAA 4.3.2.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const videos = helpers.queryAllSmart ? helpers.queryAllSmart('video') : helpers.queryAll('video');

  const occurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  function primarySubtag(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .split(/[-_]/)[0];
  }

  // The language of the video's content: its nearest lang attribute.
  // The language of the video's own audio, as its lang attribute gives it.
  // The page's language is not evidence: an English talk with French
  // subtitles on a French page is a translation.
  function videoLanguage(video) {
    return primarySubtag(dom.getAttribute(video, 'lang'));
  }

  // A track label that names captions for the deaf and hard of hearing.
  const CAPTIONS_LABEL =
    /sourds|malentendants|\bSME\b|\bSDH\b|\bCC\b|caption|untertitel f(ü|u)r h(ö|o)rgesch|subt[ií]tulos para sordos|字幕（聴覚/i;
  const KINDS = ['subtitles', 'captions', 'descriptions', 'chapters', 'metadata'];

  for (const video of videos) {
    if (!video) continue;
    const tracks = Array.from(dom.querySelectorAll(video, ':scope > *'))
      .filter((c) => String(dom.tagName(c)).toLowerCase() === 'track')
      .filter((t) => String(dom.getAttribute(t, 'src') || '').trim())
      .map((t) => {
        const raw = String(dom.getAttribute(t, 'kind') || 'subtitles')
          .trim()
          .toLowerCase();
        return {
          // A value HTML does not know makes the track metadata, never shown.
          kind: !raw ? 'subtitles' : KINDS.includes(raw) ? raw : 'invalid',
          raw,
          label: String(dom.getAttribute(t, 'label') || ''),
          srclang: primarySubtag(dom.getAttribute(t, 'srclang'))
        };
      })
      .filter((t) => ['subtitles', 'captions', 'invalid'].includes(t.kind));
    if (!tracks.length) continue;
    applicableCount += 1;
    const kinds = tracks.map((t) => t.kind);
    if (kinds.includes('captions')) continue;

    const invalid = tracks.filter((t) => t.kind === 'invalid').map((t) => t.raw);
    const lang = videoLanguage(video);
    const sameLanguage = !!lang && tracks.some((t) => t.kind === 'subtitles' && t.srclang === lang);
    const labelledCaptions = tracks.some(
      (t) => t.kind === 'subtitles' && CAPTIONS_LABEL.test(t.label)
    );
    if (!invalid.length && !sameLanguage && !labelledCaptions) {
      const srclangs = tracks.map((t) => t.srclang);
      cantTellOccurrences.push(
        helpers.reportOccurrence(video, {
          summary:
            'This video has only subtitles tracks, none in the language of the video; they may be translations rather than captions.',
          hint: 'If a track carries captions for the video’s own language, mark it kind="captions" with the matching srclang. If the tracks are translations, check that captions are provided some other way (RGAA 4.3.1).',
          occurrenceOutcome: 'cantTell',
          i18n: {
            summaryKey: 'videoCaptionsTrackKind_summary_cantTell_translation',
            hintKey: 'videoCaptionsTrackKind_hint_cantTell_translation',
            params: {}
          },
          uncertainty: {
            code: 'judgement-required',
            needed: 'Whether a subtitles track carries captions or a translation.',
            evidence: { videoLang: lang || null, srclangs }
          },
          data: {
            details: { reasonCode: 'subtitlesMayBeTranslation', kinds, srclangs },
            visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
          }
        })
      );
      continue;
    }

    occurrences.push(
      helpers.reportOccurrence(video, {
        summary: invalid.length
          ? `This video has a text track with kind="${invalid[0]}", which HTML does not know, so it is never shown; none has kind="captions".`
          : 'This video has text tracks, but none with kind="captions".',
        hint: 'Mark the track that carries the captions with kind="captions".',
        i18n: {
          summaryKey: invalid.length
            ? 'videoCaptionsTrackKind_summary_fail_invalidKind'
            : 'videoCaptionsTrackKind_summary_fail',
          hintKey: 'videoCaptionsTrackKind_hint_fail',
          params: invalid.length ? { kind: invalid[0] } : {}
        },
        data: {
          details: { reasonCode: invalid.length ? 'invalidKind' : 'noCaptionsKind', kinds },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    occurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'moderate'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
