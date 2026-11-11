/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-embedded-player-review
 * @atomic true
 * @summary Media in embedded players has its alternatives and controls
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to visible frames of known media players (YouTube, Vimeo,
 *   Dailymotion, PeerTube, SoundCloud), found by their src or a lazy
 *   loader's data-src. A page with none is notApplicable.
 * @expectation
 *   A player shows « un média temporel », which theme 4 asks to have, if
 *   needed, a transcript (4.1), synchronised captions (4.3) and an audio
 *   description (4.5), to be identified by the text next to it (4.7), to
 *   be controllable by keyboard and any pointing device (4.11) and
 *   compatible with assistive technologies (4.13). What the media holds
 *   and what the player offers can't be read from the page, so each player
 *   is asked about (embeddedPlayer). One that starts by itself (autoplay=1
 *   in its URL, auto_play=true for SoundCloud) is asked about under 4.10
 *   too (embeddedPlayerAutoplay): sound that starts on its own must stop
 *   within 3 seconds or be controllable.
 * @implementation-notes
 * - Manual (cantTell).
 * - Other players, and players a script builds without a frame, are not
 *   found.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-embedded-player-review';

const meta = {
  title: 'Media in embedded players has its alternatives and controls',
  description:
    'Flags YouTube, Vimeo, Dailymotion, PeerTube and SoundCloud players, for a person to check the transcript, captions, audio description, identification and controls theme 4 asks for, and the sound of a player that starts by itself.',
  i18n: {
    titleKey: 'embeddedPlayerReview_title',
    descriptionKey: 'embeddedPlayerReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'media', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {},
  reasonCodes: ['embeddedPlayer', 'embeddedPlayerAutoplay'],
  review: {
    embeddedPlayer: {
      steps: [
        'Find the player the report names, and play the media.',
        'Decide what it holds: sound only, picture only, or both, and whether it gives information.',
        'Look just before and after the player for a text that identifies it, and for a transcript or a link to one.',
        'In the player, turn on the captions if there is speech, and look for an audio description if the picture shows what the sound does not say.',
        'Use the play, pause and sound controls with the keyboard, then with the mouse.',
        'Listen to the controls with a screen reader.'
      ],
      passWhen:
        'The media has the alternatives it needs, a text next to it identifies it, and its controls work with the keyboard, the mouse and a screen reader.',
      failWhen:
        'A media that needs them and has no transcript (for a video, nor audio description) fails RGAA 4.1.1, 4.1.2 or 4.1.3 by its type; synchronised media without captions fails 4.3.1; one without the audio description it needs fails 4.5.1 or 4.5.2; no adjacent text that identifies it fails 4.7.1; missing controls fail 4.11.1, and controls not reachable or not operable with the keyboard and any pointing device fail 4.11.2 or 4.11.3; a player assistive technologies cannot use fails 4.13.1.'
    },
    embeddedPlayerAutoplay: {
      steps: [
        'Load the page with the sound on, and note whether the player the report names starts by itself, and for how long it makes sound.',
        'If sound plays for more than 3 seconds, look for a control on the player or in the page that stops it or sets its volume.',
        'Look just before and after the player for a text that identifies it, and for a transcript or a link to one.',
        'In the player, turn on the captions if there is speech, and look for an audio description if the picture shows what the sound does not say.',
        'Use the play, pause and sound controls with the keyboard, then with the mouse.',
        'Listen to the controls with a screen reader.'
      ],
      passWhen:
        'Sound lasts 3 seconds or less, or can be stopped or its volume set, and the media has its alternatives, an identifying text and controls that work with the keyboard, the mouse and a screen reader.',
      failWhen:
        'Sound plays for more than 3 seconds and nothing stops it or sets its volume, which fails RGAA 4.10.1. A media that needs them and has no transcript (for a video, nor audio description) fails RGAA 4.1.1, 4.1.2 or 4.1.3 by its type; synchronised media without captions fails 4.3.1; one without the audio description it needs fails 4.5.1 or 4.5.2; no adjacent text that identifies it fails 4.7.1; missing controls fail 4.11.1, and controls not reachable or not operable with the keyboard and any pointing device fail 4.11.2 or 4.11.3; a player assistive technologies cannot use fails 4.13.1.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const attr = (el, name) => {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  };
  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }
  const query = (sel) =>
    helpers.queryAllSmart ? helpers.queryAllSmart(sel) : helpers.queryAll(sel);

  const PLAYERS = [
    { service: 'YouTube', re: /(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)/i },
    { service: 'Vimeo', re: /player\.vimeo\.com\/video\//i },
    {
      service: 'Dailymotion',
      re: /(?:dailymotion\.com\/(?:embed|player)|geo\.dailymotion\.com\/player)/i
    },
    { service: 'PeerTube', re: /\/videos\/embed\/[\w-]+/i },
    { service: 'SoundCloud', re: /w\.soundcloud\.com\/player/i }
  ];
  const AUTOPLAY = /[?&](?:autoplay|auto_play)=(?:1|true)\b/i;

  const occurrences = [];
  for (const frame of query('iframe')) {
    const src = String(attr(frame, 'src') || attr(frame, 'data-src') || '');
    const player = PLAYERS.find((p) => p.re.test(src));
    if (!player || !visible(frame)) continue;
    const autoplay = AUTOPLAY.test(src);
    const kind = autoplay ? 'embeddedPlayerAutoplay' : 'embeddedPlayer';
    // The frame's title, which names the media, for the summary.
    const rawTitle = String(attr(frame, 'title') || '')
      .replace(/\s+/g, ' ')
      .trim();
    const title = rawTitle.length > 60 ? `${rawTitle.slice(0, 59)}…` : rawTitle;
    const params = { service: player.service, ...(title ? { title } : {}) };
    const titled = title ? ` titled "${title}"` : '';
    occurrences.push(
      helpers.reportOccurrence(frame, {
        summary: autoplay
          ? `This ${player.service} player${titled} starts playing by itself.`
          : `This ${player.service} player${titled} shows a media.`,
        hint: autoplay
          ? 'Check that its sound stops within 3 seconds or can be stopped or turned down (RGAA 4.10), and that the media has the transcript, captions and audio description it needs, is identified by the text next to it, and can be controlled by keyboard (RGAA 4.1, 4.3, 4.5, 4.7, 4.11, 4.13).'
          : 'Check that the media has the transcript, captions and audio description it needs, is identified by the text next to it, and can be controlled by keyboard (RGAA 4.1, 4.3, 4.5, 4.7, 4.11, 4.13).',
        i18n: {
          summaryKey: `embeddedPlayerReview_summary_cantTell_${kind}${title ? '_titled' : ''}`,
          hintKey: `embeddedPlayerReview_hint_cantTell_${kind}`,
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed:
            'What the media holds, and whether the page and the player give its alternatives and controls.'
        },
        data: {
          details: { reasonCode: kind, ...params },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
