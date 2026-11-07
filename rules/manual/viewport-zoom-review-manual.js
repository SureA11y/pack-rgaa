/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check rgaa-viewport-zoom-review
 * @atomic true
 * @summary A viewport meta tag that limits zoom should be checked against the ways RGAA lets text reach 200%
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to <meta name="viewport"> elements whose content sets
 *   user-scalable or maximum-scale to a value that disables or limits zoom:
 *   user-scalable other than yes, device-width, device-height or a number
 *   outside -1 to 1; maximum-scale from 0 up to (not including) 2, or a
 *   value that does not parse. These are the values meta-viewport-zoom-enabled
 *   fails. A page with no such tag is notApplicable. The check is
 *   whole-document: notApplicable when the scan is scoped to part of the
 *   page.
 * @expectation
 *   Always cantTell on such a tag, never pass or fail. RGAA 10.4.2 is met
 *   when text can be enlarged to 200% by any one of: the browser's text zoom,
 *   its graphic zoom, or a zoom control provided by the site (« selon une de
 *   ces conditions »). The viewport meta tag acts only on pinch zoom, which
 *   desktop browsers do not use, so whether it stops all three depends on
 *   the test environment. A person checks them.
 * @implementation-notes
 * - WCAG 1.4.4 is failed by meta-viewport-zoom-enabled, which RGAA 10.4.2
 *   may pass through one of its other conditions. This rule asks the RGAA
 *   question in its place.
 * - The content is split on commas and semicolons, as the WCAG rule does.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'rgaa-viewport-zoom-review';

const meta = {
  title: 'Text can reach 200% zoom despite a viewport meta tag that limits zoom',
  description:
    'Flags a <meta name="viewport"> that disables zoom or caps it below 200%, for a person to check that text still reaches 200% with the browser text zoom, the browser graphic zoom or a zoom control of the site.',
  i18n: {
    titleKey: 'viewportZoomReview_title',
    descriptionKey: 'viewportZoomReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {},
  reasonCodes: ['zoomRestricted'],
  review: {
    zoomRestricted: {
      steps: [
        'Open the page in the browsers of the test environment, desktop and mobile.',
        'Enlarge the text to 200% with the browser’s text zoom, then with its page zoom, and on mobile try pinching to zoom.',
        'Look also for a text size control the site provides, and check that all the text is enlarged to 200%.'
      ],
      passWhen:
        'One of the browser’s text zoom, its page zoom or a control of the site enlarges all the text to 200%.',
      failWhen:
        'None of them enlarges all the text to 200% in one of the test environment’s browsers, which fails RGAA 10.4.2.'
    }
  }
};

// Whole-document check, as meta-viewport-zoom-enabled.
// A document shown in a frame is no web page of its own (RGAA's « page web »).
function applicability(ctx) {
  if (ctx.helpers.isTopLevelDocument && !ctx.helpers.isTopLevelDocument()) return false;
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  function parseContent(raw) {
    const out = {};
    for (const pair of String(raw || '').split(/[,;]/)) {
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      const key = pair.slice(0, eq).trim().toLowerCase();
      const value = pair
        .slice(eq + 1)
        .trim()
        .toLowerCase();
      if (key) out[key] = value;
    }
    return out;
  }

  // The same reading as meta-viewport-zoom-enabled: an unparseable value
  // becomes 0 (CSS Device Adaptation), and a negative maximum-scale is
  // dropped by the browser.
  function restrictions(parsed) {
    const reasons = [];
    const userScalable = parsed['user-scalable'];
    if (
      userScalable !== undefined &&
      userScalable !== 'yes' &&
      userScalable !== 'device-width' &&
      userScalable !== 'device-height'
    ) {
      const scale = parseFloat(userScalable);
      if (Number.isNaN(scale) || (scale > -1 && scale < 1)) {
        reasons.push('user-scalable=' + userScalable);
      }
    }
    const maxScaleRaw = parsed['maximum-scale'];
    if (
      maxScaleRaw !== undefined &&
      maxScaleRaw !== 'device-width' &&
      maxScaleRaw !== 'device-height'
    ) {
      const maxScale = parseFloat(maxScaleRaw);
      if (Number.isNaN(maxScale) || (maxScale >= 0 && maxScale < 2)) {
        reasons.push('maximum-scale=' + maxScaleRaw);
      }
    }
    return reasons;
  }

  const nodes = dom.get(document, 'querySelectorAll')
    ? dom.querySelectorAll(document, 'meta[name="viewport" i]')
    : [];

  const occurrences = [];
  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    const raw = String(dom.getAttribute(el, 'content') || '').trim();
    if (!raw) continue;
    const reasons = restrictions(parseContent(raw));
    if (!reasons.length) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This viewport meta tag limits zoom (${reasons.join(', ')}).`,
        hint: 'Check that all text in the page can be enlarged to 200% with the browser text zoom, the browser graphic zoom, or a zoom control provided by the site. One of the three is enough. Removing the restriction is simpler.',
        i18n: {
          summaryKey: 'viewportZoomReview_summary_cantTell',
          hintKey: 'viewportZoomReview_hint_cantTell',
          params: { reasons: reasons.join(', ') }
        },
        data: {
          details: { reasonCode: 'zoomRestricted', reasons },
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

module.exports = { id, meta, runInPage, applicability };
