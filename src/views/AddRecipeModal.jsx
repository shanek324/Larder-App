import { useState } from "react";
import { slugify } from "../utils";

const TAGS = ["Baking","Dessert","Dinner","Quick","Vegetarian","Fish","Chicken","Pasta","Breakfast","Soup","Italian","Portuguese"];

export default function AddRecipeModal({ onClose, onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState(4);
  const [tags, setTags] = useState([]);
  const [ingredients, setIngredients] = useState([{ name: "", amount: "" }]);
  const [method, setMethod] = useState([""]);
  const [notes, setNotes] = useState("");

  function toggleTag(t) {
    setTags(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);
  }

  function updateIngredient(i, field, val) {
    setIngredients(ings => ings.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing));
  }

  function addIngredient() {
    setIngredients(ings => [...ings, { name: "", amount: "" }]);
  }

  function removeIngredient(i) {
    setIngredients(ings => ings.filter((_, idx) => idx !== i));
  }

  function updateStep(i, val) {
    setMethod(m => m.map((s, idx) => idx === i ? val : s));
  }

  function addStep() {
    setMethod(m => [...m, ""]);
  }

  function removeStep(i) {
    setMethod(m => m.filter((_, idx) => idx !== i));
  }

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({
      id: slugify(title) + "-" + Date.now(),
      title: title.trim(),
      description: description.trim(),
      prepTime: prepTime.trim(),
      cookTime: cookTime.trim(),
      servings: Number(servings),
      tags,
      ingredients: ingredients.filter(i => i.name.trim()),
      method: method.filter(s => s.trim()),
      notes: notes.trim(),
      createdAt: Date.now(),
    });
    onClose();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Recipe</h2>
          <span onClick={onClose} className="modal-close">×</span>
        </div>

        <div className="add-recipe-form">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" className="input add-recipe-input" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={2} className="input add-recipe-input" />

          <div className="add-recipe-row">
            <input value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="Prep time" className="input" />
            <input value={cookTime} onChange={e => setCookTime(e.target.value)} placeholder="Cook time" className="input" />
            <input value={servings} onChange={e => setServings(e.target.value)} placeholder="Servings" type="number" className="input" style={{ width: 80 }} />
          </div>

          <div className="add-recipe-tags">
            <p className="add-recipe-label">Tags</p>
            <div className="add-recipe-tag-list">
              {TAGS.map(t => (
                <span key={t} onClick={() => toggleTag(t)} className={"pill" + (tags.includes(t) ? " active" : "")}>{t}</span>
              ))}
            </div>
          </div>

          <div className="add-recipe-section">
            <p className="add-recipe-label">Ingredients</p>
            {ingredients.map((ing, i) => (
              <div key={i} className="add-recipe-ingredient-row">
                <input value={ing.amount} onChange={e => updateIngredient(i, "amount", e.target.value)} placeholder="Amount" className="input add-recipe-amount" />
                <input value={ing.name} onChange={e => updateIngredient(i, "name", e.target.value)} placeholder="Ingredient" className="input" style={{ flex: 1 }} />
                {ingredients.length > 1 && <span onClick={() => removeIngredient(i)} className="add-recipe-remove">×</span>}
              </div>
            ))}
            <button onClick={addIngredient} className="btn btn-secondary add-recipe-add-btn">+ Add ingredient</button>
          </div>

          <div className="add-recipe-section">
            <p className="add-recipe-label">Method</p>
            {method.map((step, i) => (
              <div key={i} className="add-recipe-step-row">
                <span className="add-recipe-step-num">{i + 1}</span>
                <textarea value={step} onChange={e => updateStep(i, e.target.value)} rows={2} placeholder={"Step " + (i + 1)} className="input" style={{ flex: 1 }} />
                {method.length > 1 && <span onClick={() => removeStep(i)} className="add-recipe-remove">×</span>}
              </div>
            ))}
            <button onClick={addStep} className="btn btn-secondary add-recipe-add-btn">+ Add step</button>
          </div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="input add-recipe-input" />

          <button onClick={handleAdd} disabled={!title.trim()} className="btn btn-primary btn-full add-recipe-submit">
            Add to Larder →
          </button>
        </div>
      </div>
    </div>
  );
}
