import React, { useEffect, useMemo, useRef, useState } from 'react';
import client from '../api/client';
import gsap from 'gsap';

export default function RulesView({ projectId, criteria = [] }) {
  const [thresholds, setThresholds] = useState([]);
  const [rules, setRules] = useState([]);

  const [isLoadingThresholds, setIsLoadingThresholds] = useState(false);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  const [thresholdForm, setThresholdForm] = useState({
    criterionId: '',
    minValue: '',
    maxValue: '',
  });
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);
  const [thresholdError, setThresholdError] = useState('');
  const [deletingThresholdId, setDeletingThresholdId] = useState(null);

  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    criterionId: '',
    operator: '>',
    value: '',
    actionType: 'exclude',
    impact: '',
  });
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [ruleError, setRuleError] = useState('');

  const [deleteError, setDeleteError] = useState('');
  const [deletingRuleId, setDeletingRuleId] = useState(null);

  const thresholdsRef = useRef(null);
  const rulesRef = useRef(null);

  const normalizedCriteria = useMemo(() => {
    if (!Array.isArray(criteria)) return [];
    return criteria
      .map((c) => ({
        id: c?.id ?? c?.criterion_id ?? c?.criterionId,
        label:
          c?.name ??
          c?.criterion_name ??
          c?.title ??
          c?.label ??
          c?.key ??
          c?.id ??
          c?.criterion_id ??
          c?.criterionId,
      }))
      .filter((c) => c.id !== undefined && c.id !== null);
  }, [criteria]);

  const isImpactRequired =
    ruleForm.actionType === 'penalty' || ruleForm.actionType === 'bonus';

  useEffect(() => {
    if (!projectId) return;
    fetchThresholds();
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    // Keep opacity stable even if animations are interrupted.
    if (!thresholdsRef.current) return;

    const children = Array.from(thresholdsRef.current.children);
    if (children.length === 0) return;

    gsap.killTweensOf(children);

    const tween = gsap.fromTo(
      children,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.06,
        duration: 0.35,
        overwrite: 'auto',
        clearProps: 'opacity,transform',
        onComplete: () => gsap.set(children, { opacity: 1 }),
      },
    );

    return () => {
      tween.kill();
      gsap.set(children, { opacity: 1, clearProps: 'opacity,transform' });
    };
  }, [thresholds]);

  useEffect(() => {
    if (!rulesRef.current) return;

    const children = Array.from(rulesRef.current.children);
    if (children.length === 0) return;

    gsap.killTweensOf(children);

    const tween = gsap.fromTo(
      children,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.06,
        duration: 0.35,
        overwrite: 'auto',
        clearProps: 'opacity,transform',
        onComplete: () => gsap.set(children, { opacity: 1 }),
      },
    );

    return () => {
      tween.kill();
      gsap.set(children, { opacity: 1, clearProps: 'opacity,transform' });
    };
  }, [rules]);

  async function fetchThresholds() {
    setIsLoadingThresholds(true);
    setThresholdError('');
    try {
      const res = await client.get(`/logic/project/${projectId}/thresholds`);
      setThresholds(res.data || []);
    } catch (err) {
      setThresholdError(
        err?.response?.data?.message ||
          err.message ||
          'Failed to load thresholds',
      );
    } finally {
      setIsLoadingThresholds(false);
    }
  }

  async function fetchRules() {
    setIsLoadingRules(true);
    setRuleError('');
    try {
      const res = await client.get(`/logic/project/${projectId}/rules`);
      setRules(res.data || []);
    } catch (err) {
      setRuleError(
        err?.response?.data?.message || err.message || 'Failed to load rules',
      );
    } finally {
      setIsLoadingRules(false);
    }
  }

  async function saveThreshold(e) {
    e.preventDefault();
    const hasMin = thresholdForm.minValue !== '';
    const hasMax = thresholdForm.maxValue !== '';

    if (!thresholdForm.criterionId) {
      setThresholdError('Criterion is required.');
      return;
    }
    if (!hasMin && !hasMax) {
      setThresholdError('Provide at least one value: Min Value or Max Value.');
      return;
    }
    if (hasMin && Number.isNaN(Number(thresholdForm.minValue))) {
      setThresholdError('Min Value must be a valid number.');
      return;
    }
    if (hasMax && Number.isNaN(Number(thresholdForm.maxValue))) {
      setThresholdError('Max Value must be a valid number.');
      return;
    }
    if (
      hasMin &&
      hasMax &&
      Number(thresholdForm.minValue) > Number(thresholdForm.maxValue)
    ) {
      setThresholdError('Min Value cannot be greater than Max Value.');
      return;
    }

    setIsSavingThreshold(true);
    setThresholdError('');
    try {
      const payload = {
        criterionId: thresholdForm.criterionId,
        minValue:
          thresholdForm.minValue === '' ? null : Number(thresholdForm.minValue),
        maxValue:
          thresholdForm.maxValue === '' ? null : Number(thresholdForm.maxValue),
      };
      await client.post(`/logic/project/${projectId}/thresholds`, payload);
      setThresholdForm({ criterionId: '', minValue: '', maxValue: '' });
      await fetchThresholds();
    } catch (err) {
      setThresholdError(
        err?.response?.data?.message ||
          err.message ||
          'Failed to save threshold',
      );
    } finally {
      setIsSavingThreshold(false);
    }
  }

  async function saveRule(e) {
    e.preventDefault();
    if (!ruleForm.name.trim()) {
      setRuleError('Rule Name is required.');
      return;
    }
    if (!ruleForm.criterionId) {
      setRuleError('Criterion is required.');
      return;
    }
    if (ruleForm.value === '' || Number.isNaN(Number(ruleForm.value))) {
      setRuleError('Value must be a valid number.');
      return;
    }
    if (
      isImpactRequired &&
      (ruleForm.impact === '' || Number.isNaN(Number(ruleForm.impact)))
    ) {
      setRuleError(
        'Impact is required for penalty/bonus and must be a valid number.',
      );
      return;
    }
    if (
      isImpactRequired &&
      (Number(ruleForm.impact) < 0 || Number(ruleForm.impact) > 1)
    ) {
      setRuleError('Impact must be between 0 and 1.');
      return;
    }

    setIsSavingRule(true);
    setRuleError('');
    try {
      // Build payload expected by backend
      const condition = {
        criterionId: ruleForm.criterionId,
        operator: ruleForm.operator,
        value: Number(ruleForm.value),
      };
      const action = {
        type: ruleForm.actionType,
        impact: isImpactRequired ? Number(ruleForm.impact) : 0,
      };

      const payload = {
        ruleName: ruleForm.name,
        conditionJson: condition,
        actionJson: action,
      };

      await client.post(`/logic/project/${projectId}/rules`, payload);
      setRuleForm({
        name: '',
        criterionId: '',
        operator: '>',
        value: '',
        actionType: 'exclude',
        impact: '',
      });
      setShowRuleForm(false);
      await fetchRules();
    } catch (err) {
      setRuleError(
        err?.response?.data?.message || err.message || 'Failed to save rule',
      );
    } finally {
      setIsSavingRule(false);
    }
  }

  async function deleteThreshold(thresholdId) {
    if (!window.confirm('Delete this threshold?')) return;
    setDeletingThresholdId(thresholdId);
    setThresholdError('');
    try {
      await client.delete(`/logic/thresholds/${thresholdId}`);
      setThresholds((s) =>
        s.filter((t) => (t.id ?? t.thresholdId ?? t._id) !== thresholdId),
      );
    } catch (err) {
      setThresholdError(
        err?.response?.data?.message ||
          err.message ||
          'Failed to delete threshold',
      );
    } finally {
      setDeletingThresholdId(null);
    }
  }

  async function deleteRule(ruleId) {
    if (!window.confirm('Delete this rule?')) return;
    setDeletingRuleId(ruleId);
    setDeleteError('');
    try {
      await client.delete(`/logic/rules/${ruleId}`);
      setRules((s) =>
        s.filter(
          (r) => r.id !== ruleId && r.ruleId !== ruleId && r._id !== ruleId,
        ),
      );
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message || err.message || 'Failed to delete rule',
      );
    } finally {
      setDeletingRuleId(null);
    }
  }

  function getCriterionLabel(criterionId) {
    const c = normalizedCriteria.find(
      (x) => String(x.id) === String(criterionId),
    );
    if (!c) return String(criterionId || '—');
    return String(c.label);
  }

  return (
    <div className="space-y-8">
      {/* Thresholds Card */}
      <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Thresholds</h3>

        <form className="space-y-4 mb-6" onSubmit={saveThreshold}>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Criterion
              </label>
              <select
                className="w-full border-gray-200 rounded-lg px-3 py-2"
                value={thresholdForm.criterionId}
                onChange={(e) =>
                  setThresholdForm((s) => ({
                    ...s,
                    criterionId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Select criterion</option>
                {normalizedCriteria.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Min Value
              </label>
              <input
                type="number"
                className="w-full border-gray-200 rounded-lg px-3 py-2"
                value={thresholdForm.minValue}
                onChange={(e) =>
                  setThresholdForm((s) => ({ ...s, minValue: e.target.value }))
                }
                placeholder="e.g. 0"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Max Value
              </label>
              <input
                type="number"
                className="w-full border-gray-200 rounded-lg px-3 py-2"
                value={thresholdForm.maxValue}
                onChange={(e) =>
                  setThresholdForm((s) => ({ ...s, maxValue: e.target.value }))
                }
                placeholder="e.g. 100"
              />
            </div>

            <div>
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 px-4 py-2"
                disabled={isSavingThreshold || !thresholdForm.criterionId}
              >
                {isSavingThreshold ? 'Saving...' : 'Save Threshold'}
              </button>
            </div>
          </div>
          {thresholdError && (
            <p className="text-red-600 text-sm">{thresholdError}</p>
          )}
        </form>

        <div>
          {isLoadingThresholds ? (
            <p>Loading thresholds...</p>
          ) : thresholds.length === 0 ? (
            <p className="text-sm text-gray-500">
              No thresholds configured for this project.
            </p>
          ) : (
            <div ref={thresholdsRef} className="space-y-2">
              {thresholds.map((t) => {
                const thresholdId = t.id ?? t.thresholdId ?? t._id;

                return (
                  <div
                    key={thresholdId ?? `${t.criterionId}-${t.min}-${t.max}`}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {getCriterionLabel(t.criterionId ?? t.criterion_id)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {t.minValue ?? t.min_value ?? t.min ?? '—'} — Max:{' '}
                        {t.maxValue ?? t.max_value ?? t.max ?? '—'}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {t.id ?? '—'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => deleteThreshold(thresholdId)}
                        disabled={deletingThresholdId === thresholdId}
                      >
                        {deletingThresholdId === thresholdId
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rules Card */}
      <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">IF-THEN Rules</h3>

        <div className="mb-4">
          <button
            className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 px-4 py-2"
            onClick={() => setShowRuleForm((s) => !s)}
          >
            {showRuleForm ? 'Cancel' : 'Create New Rule'}
          </button>
        </div>

        {showRuleForm && (
          <form className="space-y-4 mb-6" onSubmit={saveRule}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  className="w-full border-gray-200 rounded-lg px-3 py-2"
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm((s) => ({ ...s, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Criterion
                </label>
                <select
                  className="w-full border-gray-200 rounded-lg px-3 py-2"
                  value={ruleForm.criterionId}
                  onChange={(e) =>
                    setRuleForm((s) => ({ ...s, criterionId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select criterion</option>
                  {normalizedCriteria.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Operator
                </label>
                <select
                  className="w-full border-gray-200 rounded-lg px-3 py-2"
                  value={ruleForm.operator}
                  onChange={(e) =>
                    setRuleForm((s) => ({ ...s, operator: e.target.value }))
                  }
                >
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="==">==</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  className="w-full border-gray-200 rounded-lg px-3 py-2"
                  value={ruleForm.value}
                  onChange={(e) =>
                    setRuleForm((s) => ({ ...s, value: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  className="w-full border-gray-200 rounded-lg px-3 py-2"
                  value={ruleForm.actionType}
                  onChange={(e) =>
                    setRuleForm((s) => ({
                      ...s,
                      actionType: e.target.value,
                      impact: e.target.value === 'exclude' ? '' : s.impact,
                    }))
                  }
                >
                  <option value="exclude">exclude</option>
                  <option value="penalty">penalty</option>
                  <option value="bonus">bonus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Impact
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  className="w-full border-gray-200 rounded-lg px-3 py-2"
                  value={ruleForm.impact}
                  onChange={(e) =>
                    setRuleForm((s) => ({ ...s, impact: e.target.value }))
                  }
                  disabled={!isImpactRequired}
                  placeholder="e.g. 0.2"
                  required={isImpactRequired}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 px-4 py-2"
                disabled={isSavingRule}
              >
                {isSavingRule ? 'Saving...' : 'Save Rule'}
              </button>
            </div>

            {ruleError && <p className="text-red-600 text-sm">{ruleError}</p>}
          </form>
        )}

        <div>
          {isLoadingRules ? (
            <p>Loading rules...</p>
          ) : rules.length === 0 ? (
            <p className="text-sm text-gray-500">
              No rules configured for this project.
            </p>
          ) : (
            <div ref={rulesRef} className="space-y-3">
              {rules.map((r) => {
                // r may include conditionJson/actionJson as strings or objects
                let condition;
                let action;
                try {
                  condition =
                    typeof (r.conditionJson ?? r.condition_json) === 'string'
                      ? JSON.parse(r.conditionJson ?? r.condition_json)
                      : (r.conditionJson ?? r.condition_json);
                } catch {
                  condition = r.conditionJson ?? r.condition_json ?? {};
                }
                try {
                  action =
                    typeof (r.actionJson ?? r.action_json) === 'string'
                      ? JSON.parse(r.actionJson ?? r.action_json)
                      : (r.actionJson ?? r.action_json);
                } catch {
                  action = r.actionJson ?? r.action_json ?? {};
                }

                const ruleId = r.id ?? r.ruleId ?? r._id;

                return (
                  <div
                    key={ruleId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {r.rule_name ?? r.name ?? `Rule ${ruleId}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        IF{' '}
                        {getCriterionLabel(
                          condition?.criterionId ?? condition?.criterion_id,
                        )}{' '}
                        {condition?.operator} {condition?.value} THEN{' '}
                        {action?.type} ({action?.impact})
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-sm text-red-600 hover:underline"
                        onClick={() => deleteRule(ruleId)}
                        disabled={deletingRuleId === ruleId}
                      >
                        {deletingRuleId === ruleId ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {deleteError && (
            <p className="text-red-600 text-sm mt-2">{deleteError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
