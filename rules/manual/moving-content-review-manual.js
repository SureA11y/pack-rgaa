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
 *   indefinitely; and, where the page has a layout, an animation running
 *   on visible content when the scan starts (CSS animation, CSS transition
 *   or one a script started) that repeats indefinitely or lasts more than 5
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
 * - The engine moves finite animations to their end while it scans, so
 *   they are read as they were when the scan started
 *   (helpers.animationsAtScanStart, core 1.14.0). With an older core, only
 *   endless ones are found.
 * - A CSS animation's keyframes are read from its live animation or from
 *   the page's @keyframes rule; a script's animation, whose keyframes are
 *   not known, is reported as moving.
 * - One occurrence per element.
 * - Opt-in (tag `rgaa`).
 */

const id = 'rgaa-moving-content-review';

const meta = {
  title: 'Moving or blinking content can be controlled',
  description:
    'Flags content that moves or blinks by itself for more than 5 seconds (marquee, autoplaying video without controls, endless SVG animations, CSS and script animations), for a person to check that it can be stopped, hidden or read without the movement.',
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
  coverage: {},
  reasonCodes: ['marquee', 'autoplayVideo', 'svgAnimation', 'movingAnimation', 'blinkingAnimation'],
  review: {
    marquee: {
      steps: [
        'Find the <marquee> the report names: its text scrolls by itself.',
        'Load the page, and time the movement: note whether it stops by itself within 5 seconds.',
        'If it goes on, look for a control, such as a pause button, on it or near it, and use it.',
        'Check that the control stops and restarts the movement, hides and shows the content again, or shows all of its content without the movement. It must work with the keyboard and the mouse at least; pausing only while the pointer or the focus is on the content does not count.'
      ],
      passWhen:
        'The movement lasts 5 seconds or less, or a control stops and restarts it, hides the content, or shows it all without the movement.',
      failWhen:
        'The movement lasts more than 5 seconds and no control does any of these, which fails RGAA 13.8.1.'
    },
    autoplayVideo: {
      steps: [
        'Find the video the report names: it plays by itself and has no browser controls.',
        'Decide whether it carries information: then it is a temporal medium, which the multimedia theme judges. A video that only decorates is judged as moving content.',
        'If it carries information, check that it offers play and pause (or stop), and also sound on/off if it has sound, show/hide captions if it has captions, and audio description on/off if it has one.',
        'If it only decorates, time the movement and look for a control that stops it, hides it or shows the content without it, which works with the keyboard and the mouse at least.'
      ],
      passWhen:
        'A video with information has its controls, or a video that only decorates moves for 5 seconds or less, or has such a control.',
      failWhen:
        'A video with information has no controls, which fails RGAA 4.11.1; or a video that only decorates moves for more than 5 seconds with no such control, which fails RGAA 13.8.1.'
    },
    svgAnimation: {
      steps: [
        'Find the <svg> the report names: it has an animation that repeats without end.',
        'Load the page, and time the movement: note whether it stops by itself within 5 seconds.',
        'If it goes on, look for a control, such as a pause button, on it or near it, and use it.',
        'Check that the control stops and restarts the movement, hides and shows the content again, or shows all of its content without the movement. It must work with the keyboard and the mouse at least; pausing only while the pointer or the focus is on the content does not count.'
      ],
      passWhen:
        'The movement lasts 5 seconds or less, or a control stops and restarts it, hides the content, or shows it all without the movement.',
      failWhen:
        'The movement lasts more than 5 seconds and no control does any of these, which fails RGAA 13.8.1.'
    },
    movingAnimation: {
      steps: [
        'Find the element the report names: an animation runs on it by itself.',
        'Load the page, and time the movement: note whether it stops by itself within 5 seconds.',
        'If it goes on, look for a control, such as a pause button, on it or near it, and use it.',
        'Check that the control stops and restarts the movement, hides and shows the content again, or shows all of its content without the movement. It must work with the keyboard and the mouse at least; pausing only while the pointer or the focus is on the content does not count.'
      ],
      passWhen:
        'The movement lasts 5 seconds or less, or a control stops and restarts it, hides the content, or shows it all without the movement; or the movement is part of what the element does, such as a progress bar, which RGAA makes not applicable.',
      failWhen:
        'The movement lasts more than 5 seconds and no control does any of these, which fails RGAA 13.8.1.'
    },
    blinkingAnimation: {
      steps: [
        'Find the element the report names: an animation makes it blink by itself.',
        'Load the page, and time the blinking: note whether it stops by itself within 5 seconds.',
        'If it goes on, look for a control, such as a pause button, on it or near it, and use it.',
        'Check that the control stops and restarts the blinking, hides and shows the content again, or shows all of its content without the blinking. It must work with the keyboard and the mouse at least; pausing only while the pointer or the focus is on the content does not count.'
      ],
      passWhen:
        'The blinking lasts 5 seconds or less, or a control stops and restarts it, hides the content, or shows it all without the blinking.',
      failWhen:
        'The blinking lasts more than 5 seconds and no control does any of these, which fails RGAA 13.8.2.'
    }
  }
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
  // extra: { element, attribute } of an SVG animation that names the
  // attribute it changes, for the summary.
  function report(el, kind, extra) {
    if (!el || seen.has(el)) return;
    seen.add(el);
    const params = extra || {};
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: extra
          ? `This SVG animation repeats indefinitely: its <${extra.element}> changes the ${extra.attribute} attribute.`
          : SUMMARY[kind],
        hint: HINT,
        i18n: {
          summaryKey: `movingContentReview_summary_${kind}${extra ? '_attribute' : ''}`,
          hintKey: 'movingContentReview_hint_cantTell',
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the user can stop, hide or do without the movement.'
        },
        data: {
          details: { reasonCode: kind, ...params },
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
    const changed = String(attr(el, 'attributeName') || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);
    report(
      svg,
      'svgAnimation',
      changed ? { element: String(dom.localName(el) || dom.tagName(el)), attribute: changed } : null
    );
  }

  // Animations, where the page has a layout to run them. The engine moves
  // finite ones to their end while rules run, so they are read as they
  // were when the scan started (helpers.animationsAtScanStart); without that
  // helper, only those still listed by getAnimations() are seen.
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
  const META_KEYS = ['offset', 'easing', 'composite', 'computedOffset'];
  const propsOfFrames = (frames) => {
    const props = new Set();
    for (const f of frames || []) {
      for (const k of Object.keys(f)) if (!META_KEYS.includes(k)) props.add(k);
    }
    return props;
  };
  // The properties a named CSS animation changes: from its live animation
  // when one is still listed, else from the page's @keyframes rule.
  function keyframeProps(target, name) {
    try {
      for (const a of dom.get(target, 'getAnimations') ? dom.getAnimations(target) || [] : []) {
        if (a.animationName === name && a.effect && a.effect.getKeyframes) {
          return propsOfFrames(a.effect.getKeyframes());
        }
      }
    } catch {}
    const props = new Set();
    const walk = (rules) => {
      for (const r of [...(rules || [])]) {
        if (r.type === 7 && r.name === name) {
          for (const f of [...(r.cssRules || [])]) {
            for (let i = 0; i < f.style.length; i += 1) props.add(f.style[i]);
          }
        } else if (r.cssRules) walk(r.cssRules);
      }
    };
    try {
      for (const sheet of [...(dom.get(document, 'styleSheets') || [])]) {
        walk(helpers.cssRulesOf ? helpers.cssRulesOf(sheet) : sheet.cssRules);
      }
    } catch {}
    return props;
  }
  const isBlinking = (props) => props.size > 0 && [...props].every((p) => BLINK_PROPS.has(p));

  let started = null;
  try {
    if (typeof helpers.animationsAtScanStart === 'function') {
      started = helpers.animationsAtScanStart();
    }
  } catch {
    started = null;
  }
  if (Array.isArray(started)) {
    for (const a of started) {
      try {
        // endTime: from the animation's start, its delay and every
        // iteration; null when it never ends.
        if (a.endTime != null && a.endTime <= 5000) continue;
        const target = a.target;
        if (!target || dom.nodeType(target) !== 1 || !visible(target)) continue;
        const props =
          a.kind === 'css-transition'
            ? new Set([String(a.name || '')].filter(Boolean))
            : a.kind === 'css-animation'
              ? keyframeProps(target, a.name)
              : new Set();
        report(target, isBlinking(props) ? 'blinkingAnimation' : 'movingAnimation');
      } catch {}
    }
  } else {
    let animations = [];
    try {
      if (typeof dom.get(document, 'getAnimations') === 'function') {
        animations = dom.getAnimations(document) || [];
      }
    } catch {
      animations = [];
    }
    for (const a of animations) {
      try {
        if (a.playState !== 'running' || !a.effect) continue;
        const timing = a.effect.getComputedTiming ? a.effect.getComputedTiming() : {};
        const iterations = timing.iterations;
        const total = iterations === Infinity ? Infinity : Number(timing.activeDuration || 0) || 0;
        if (total <= 5000) continue;
        const target = a.effect.target;
        if (!target || dom.nodeType(target) !== 1 || !visible(target)) continue;
        const props = propsOfFrames(a.effect.getKeyframes ? a.effect.getKeyframes() : []);
        if (!props.size) continue;
        report(target, isBlinking(props) ? 'blinkingAnimation' : 'movingAnimation');
      } catch {}
    }
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
