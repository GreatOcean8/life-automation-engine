import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, Shield, FileText } from 'lucide-react';

export default function SkillEditor({ skills, onSaveSkill }) {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [editInstructions, setEditInstructions] = useState('');
  const [editRules, setEditRules] = useState([]);
  const [newRuleText, setNewRuleText] = useState('');

  useEffect(() => {
    if (skills && skills.length > 0) {
      if (!selectedSkill) {
        handleSelectSkill(skills[0]);
      } else {
        const updated = skills.find(s => s.name === selectedSkill.name);
        if (updated) {
          setSelectedSkill(updated);
          setEditInstructions(updated.instructions || '');
          setEditRules(updated.rules || []);
        }
      }
    }
  }, [skills]);


  const handleSelectSkill = (skill) => {
    setSelectedSkill(skill);
    setEditInstructions(skill.instructions || '');
    setEditRules(skill.rules || []);
  };

  const handleAddRule = () => {
    if (!newRuleText.trim()) return;
    setEditRules([...editRules, newRuleText.trim()]);
    setNewRuleText('');
  };

  const handleRemoveRule = (index) => {
    setEditRules(editRules.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedSkill) return;
    onSaveSkill({
      ...selectedSkill,
      instructions: editInstructions,
      rules: editRules
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">Dynamic Skill Engine & Hot-Reloading</h2>
        <p className="text-xs text-slate-400">Modify SKILL.md instructions, rules, and UI schemas live without server restarts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Skills List */}
        <div className="glass-card p-4 rounded-2xl border border-amber-500/20 space-y-2">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider px-2 mb-2">Available Skill Packages</h3>
          {skills.map(s => (
            <div
              key={s.name}
              onClick={() => handleSelectSkill(s)}
              className={`p-3 rounded-xl border cursor-pointer transition ${
                selectedSkill?.name === s.name ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-500/50' : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
              }`}
            >
              <div className="font-semibold text-white text-xs">{s.name}</div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{s.description}</div>
            </div>
          ))}
        </div>

        {/* Skill Editor */}
        {selectedSkill ? (
          <div className="md:col-span-2 glass-card p-6 rounded-2xl border border-amber-500/20 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">{selectedSkill.name}</h3>
                <p className="text-xs text-slate-400">{selectedSkill.description}</p>
              </div>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 hover:brightness-110"
              >
                Save & Hot-Reload Skill
              </button>
            </div>

            {/* Dynamic UI Controls */}
            {selectedSkill.ui_schema && selectedSkill.ui_schema.controls && (
              <div className="p-4 bg-slate-900/90 rounded-xl border border-amber-500/30 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Dynamic Skill Controls (from SKILL.md ui_schema)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedSkill.ui_schema.controls.map(c => (
                    <div key={c.id} className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">{c.label}</label>
                      {c.type === 'slider' ? (
                        <input type="range" min={c.min} max={c.max} defaultValue={c.default} className="w-full accent-amber-400" />
                      ) : (
                        <input type="text" defaultValue={c.default} className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-xs text-white" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules List */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Guardrail Rules</span>
              </label>
              <div className="space-y-1.5">
                {editRules.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-200">
                    <span>{rule}</span>
                    <button onClick={() => handleRemoveRule(idx)} className="text-slate-500 hover:text-red-400 text-xs font-bold">×</button>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  placeholder="Add new rule..."
                  value={newRuleText}
                  onChange={e => setNewRuleText(e.target.value)}
                  className="flex-1 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
                <button
                  onClick={handleAddRule}
                  className="px-3 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-lg"
                >
                  Add Rule
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>System Prompt Instructions (Markdown)</span>
              </label>
              <textarea
                value={editInstructions}
                onChange={e => setEditInstructions(e.target.value)}
                rows={8}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-200 leading-relaxed"
              />
            </div>
          </div>
        ) : (
          <div className="md:col-span-2 glass-card p-12 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
            Select a skill to edit
          </div>
        )}
      </div>
    </div>
  );
}
