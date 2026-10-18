/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-moving-content-review
 * @atomic true
 * @summary Moving or blinking content that starts by itself can be controlled
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to content that moves or blinks by itself for more than 5
 *   seconds, as the page shows it: a <marquee>; a <video> that plays by
 *   itself (autoplay) with no controls attribute; an SVG animation
 *   (<animate>, <animateTransform>, <animateMotion>, <set>) repeated
 *   indefinitely; and, where the page has a layout, a running CSS animation
 *   on visible content that repeats indefinitely or lasts more than 5
 *   seconds. A page with none is notApplicable.
 * @expectation
 *   RGAA 13.8.1 (moving content) and 13.8.2 (blinking content): content
 *   triggered automatically lasts 5 seconds or less, or the user can stop
 *   and restart it, show and hide it, or see all of its information
 *   without the movement. Each case is asked about (cantTell): a script or
 *   a button elsewhere in the page may give that control, which only a
 *   person can try. A CSS animation of opacity, visibility or colour only
 *   is reported as blinking (blinkingAnimation), any other as moving
 *   (movingAnimation).
 * @implementation-notes
 * - Manual (cantTell): the control a script gives is not in the markup.
 * - A <video> with the controls attribute can be paused, and is left out.
 * - Animated images (GIF, APNG, WebP) and carousels driven by a script
 *   are not found: the markup does not show that they move.
 * - A finite CSS animation longer than 5 seconds is not found: the engine
 *   moves finite animations to their end while it scans, and the page no
 *   longer lists them. Endless ones are found.
 * - One occurrence per element.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-moving-content-review';

const meta = {
  title: 'Moving or blinking content can be controlled',
  description:
    'Flags content that moves or blinks by itself for more than 5 seconds (marquee, autoplaying video without controls, endless SVG or CSS animations), for a person to check that it can be stopped, hidden or read without the movement.',
  i18n: {
    titleKey: 'movingContentReview_title',
    descriptionKey: 'movingContentReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'motion', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'high',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const tagOf = (el) => String(dom.localName(el) || dom.tagName(el) || '').toLowerCase();
  const attr = (el, name) => {
    try {
      return String(dom.getAttribute(el, name) || '').trim();
    } catch {
      return '';
    }
  };
  const query = (sel) =>
    helpers.queryAllSmart ? helpers.queryAllSmart(sel) : helpers.queryAll(sel);

  function visible(el) {
    try {
      if (helpers.isDomVisibleEligible) {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      }
    } catch {}
    return true;
  }

  const SUMMARY = {
    marquee: 'This <marquee> scrolls its content by itself.',
    autoplayVideo: 'This video plays by itself and has no controls attribute.',
    svgAnimation: 'This SVG animation repeats indefinitely.',
    movingAnimation:
      'This content moves by itself with a CSS animation that repeats indefinitely or lasts more than 5 seconds.',
    blinkingAnimation:
      'This content blinks by itself with a CSS animation that repeats indefinitely or lasts more than 5 seconds.'
  };
  const HINT =
    'Check that the user can stop and restart the movement, hide the content, or see all of its information without the movement, unless it lasts 5 seconds or less (RGAA 13.8).';

  const occurrences = [];
  const seen = new Set();
  function report(el, kind) {
    if (!el || seen.has(el)) return;
    seen.add(el);
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: SUMMARY[kind],
        hint: HINT,
        i18n: {
          summaryKey: `movingContentReview_summary_${kind}`,
          hintKey: 'movingContentReview_hint_cantTell',
          params: {}
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the user can stop, hide or do without the movement.'
        },
        data: {
          details: { reasonCode: kind },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  for (const el of query('marquee')) {
    // scrollamount="0" does not move.
    if (attr(el, 'scrollamount') === '0' || !visible(el)) continue;
    report(el, 'marquee');
  }

  for (const el of query('video[autoplay]')) {
    if (dom.hasAttribute(el, 'controls') || !visible(el)) continue;
    report(el, 'autoplayVideo');
  }

  for (const el of query('animate, animateTransform, animateMotion, set')) {
    if (attr(el, 'repeatCount').toLowerCase() !== 'indefinite') continue;
    const svg = dom.closest(el, 'svg') || dom.parentElement(el);
    if (!svg || !visible(svg)) continue;
    report(svg, 'svgAnimation');
  }

  // CSS animations, where the page has a layout to run them.
  let animations = [];
  try {
    if (typeof dom.get(document, 'getAnimations') === 'function') {
      animations = dom.getAnimations(document) || [];
    }
  } catch {
    animations = [];
  }
  const BLINK_PROPS = new Set([
    'opacity',
    'visibility',
    'color',
    'backgroundColor',
    'background-color',
    'borderColor',
    'border-color',
    'fill',
    'stroke'
  ]);
  for (const a of animations) {
    try {
      if (a.playState !== 'running' || !a.effect) continue;
      const timing = a.effect.getComputedTiming ? a.effect.getComputedTiming() : {};
      const iterations = timing.iterations;
      const total = iterations === Infinity ? Infinity : Number(timing.activeDuration || 0) || 0;
      if (total <= 5000) continue;
      const target = a.effect.target;
      if (!target || dom.nodeType(target) !== 1 || !visible(target)) continue;
      const frames = a.effect.getKeyframes ? a.effect.getKeyframes() : [];
      const props = new Set();
      for (const f of frames) {
        for (const k of Object.keys(f)) {
          if (!['offset', 'easing', 'composite', 'computedOffset'].includes(k)) props.add(k);
        }
      }
      if (!props.size) continue;
      const blinking = Array.from(props).every((p) => BLINK_PROPS.has(p));
      report(target, blinking ? 'blinkingAnimation' : 'movingAnimation');
    } catch {}
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
