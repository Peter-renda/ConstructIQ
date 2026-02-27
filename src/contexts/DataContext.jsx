import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const DataContext = createContext(null);

// ─── snake_case ↔ camelCase helpers ─────────────────────────────────────────

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

/** Convert a DB row (snake_case keys) → app object (camelCase keys) */
function fromDb(row) {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) out[snakeToCamel(k)] = v;
  return out;
}

/** Convert an app object (camelCase keys) → DB row (snake_case keys).
 *  Always strips `id` and `createdAt` so the DB generates them.
 *  Converts empty strings to null so uuid/date columns don't reject them. */
function toDb(obj) {
  if (!obj) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'id' || k === 'createdAt') continue;
    out[camelToSnake(k)] = v === '' ? null : v;
  }
  return out;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function DataProvider({ children }) {
  const [dataLoading, setDataLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [dirUsers, setDirUsers] = useState([]);
  const [dirCompanies, setDirCompanies] = useState([]);
  const [distGroups, setDistGroups] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rfis, setRfis] = useState([]);
  const [submittals, setSubmittals] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => {
    async function fetchAll() {
      const [
        { data: proj }, { data: mem },
        { data: du }, { data: dc }, { data: dg },
        { data: docs }, { data: tsk }, { data: rfi },
        { data: sub }, { data: spec }, { data: act },
      ] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('project_members').select('*'),
        supabase.from('dir_users').select('*'),
        supabase.from('dir_companies').select('*'),
        supabase.from('dist_groups').select('*'),
        supabase.from('documents').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('rfis').select('*'),
        supabase.from('submittals').select('*'),
        supabase.from('specifications').select('*'),
        supabase.from('activity_feed').select('*').order('created_at', { ascending: false }).limit(500),
      ]);
      setProjects((proj || []).map(fromDb));
      setProjectMembers((mem || []).map(fromDb));
      setDirUsers((du || []).map(fromDb));
      setDirCompanies((dc || []).map(fromDb));
      setDistGroups((dg || []).map(fromDb));
      setDocuments((docs || []).map(fromDb));
      setTasks((tsk || []).map(fromDb));
      setRfis((rfi || []).map(fromDb));
      setSubmittals((sub || []).map(fromDb));
      setSpecifications((spec || []).map(fromDb));
      setActivityFeed((act || []).map(fromDb));
      setDataLoading(false);
    }
    fetchAll();
  }, []);

  // ─── Activity ──────────────────────────────────────────────────────────────
  async function addActivity(projectId, type, action, details, userId) {
    const { data } = await supabase
      .from('activity_feed')
      .insert({ project_id: projectId, type, action, details, user_id: userId })
      .select()
      .single();
    if (data) setActivityFeed(prev => [fromDb(data), ...prev.slice(0, 499)]);
  }

  // ─── Projects ──────────────────────────────────────────────────────────────
  async function addProject(data, userId) {
    const { data: row, error } = await supabase
      .from('projects')
      .insert({ ...toDb(data), created_by: userId })
      .select()
      .single();
    if (error || !row) { console.error('addProject:', error); return null; }
    const p = fromDb(row);
    setProjects(prev => [p, ...prev]);
    if (userId) {
      const { data: mem } = await supabase
        .from('project_members')
        .insert({ project_id: p.id, user_id: userId, role: 'administrator' })
        .select()
        .single();
      if (mem) setProjectMembers(prev => [...prev, fromDb(mem)]);
    }
    addActivity(p.id, 'project', 'created', `Project "${p.name}" created`, userId);
    return p;
  }

  async function updateProject(id, data, userId) {
    const { error } = await supabase.from('projects').update(toDb(data)).eq('id', id);
    if (error) { console.error('updateProject:', error); return; }
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    addActivity(id, 'project', 'updated', 'Project information updated', userId);
  }

  async function deleteProject(id) {
    await supabase.from('projects').delete().eq('id', id);
    // CASCADE in Supabase deletes all related rows; mirror in local state
    setProjects(prev => prev.filter(p => p.id !== id));
    setProjectMembers(prev => prev.filter(m => m.projectId !== id));
    setDirUsers(prev => prev.filter(u => u.projectId !== id));
    setDirCompanies(prev => prev.filter(c => c.projectId !== id));
    setDistGroups(prev => prev.filter(g => g.projectId !== id));
    setDocuments(prev => prev.filter(d => d.projectId !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    setRfis(prev => prev.filter(r => r.projectId !== id));
    setSubmittals(prev => prev.filter(s => s.projectId !== id));
    setActivityFeed(prev => prev.filter(a => a.projectId !== id));
    setSpecifications(prev => prev.filter(s => s.projectId !== id));
  }

  // ─── Project Members ────────────────────────────────────────────────────────
  async function addProjectMember(projectId, userId, role) {
    const existing = projectMembers.find(m => m.projectId === projectId && m.userId === userId);
    if (existing) {
      await supabase.from('project_members').update({ role })
        .eq('project_id', projectId).eq('user_id', userId);
      setProjectMembers(prev => prev.map(m =>
        m.projectId === projectId && m.userId === userId ? { ...m, role } : m
      ));
    } else {
      const { data } = await supabase
        .from('project_members')
        .insert({ project_id: projectId, user_id: userId, role })
        .select().single();
      if (data) setProjectMembers(prev => [...prev, fromDb(data)]);
    }
  }

  async function removeProjectMember(projectId, userId) {
    await supabase.from('project_members').delete()
      .eq('project_id', projectId).eq('user_id', userId);
    setProjectMembers(prev => prev.filter(m => !(m.projectId === projectId && m.userId === userId)));
  }

  function getProjectRole(projectId, userId) {
    return projectMembers.find(m => m.projectId === projectId && m.userId === userId)?.role;
  }

  function getUserProjects(userId) {
    const ids = new Set(projectMembers.filter(m => m.userId === userId).map(m => m.projectId));
    return projects.filter(p => ids.has(p.id));
  }

  // ─── Directory Users ────────────────────────────────────────────────────────
  async function addDirUser(projectId, data) {
    const { data: row } = await supabase
      .from('dir_users')
      .insert({ ...toDb(data), project_id: projectId })
      .select().single();
    const u = fromDb(row);
    if (u) setDirUsers(prev => [...prev, u]);
    return u;
  }

  async function updateDirUser(id, data) {
    await supabase.from('dir_users').update(toDb(data)).eq('id', id);
    setDirUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  }

  async function deleteDirUser(id) {
    await supabase.from('dir_users').delete().eq('id', id);
    setDirUsers(prev => prev.filter(u => u.id !== id));
  }

  // ─── Directory Companies ────────────────────────────────────────────────────
  async function addDirCompany(projectId, data) {
    const { data: row } = await supabase
      .from('dir_companies')
      .insert({ ...toDb(data), project_id: projectId })
      .select().single();
    const c = fromDb(row);
    if (c) setDirCompanies(prev => [...prev, c]);
    return c;
  }

  async function updateDirCompany(id, data) {
    await supabase.from('dir_companies').update(toDb(data)).eq('id', id);
    setDirCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }

  async function deleteDirCompany(id) {
    await supabase.from('dir_companies').delete().eq('id', id);
    setDirCompanies(prev => prev.filter(c => c.id !== id));
  }

  // ─── Distribution Groups ────────────────────────────────────────────────────
  async function addDistGroup(projectId, data) {
    const { data: row } = await supabase
      .from('dist_groups')
      .insert({ ...toDb(data), project_id: projectId })
      .select().single();
    const g = fromDb(row);
    if (g) setDistGroups(prev => [...prev, g]);
    return g;
  }

  async function updateDistGroup(id, data) {
    await supabase.from('dist_groups').update(toDb(data)).eq('id', id);
    setDistGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
  }

  async function deleteDistGroup(id) {
    await supabase.from('dist_groups').delete().eq('id', id);
    setDistGroups(prev => prev.filter(g => g.id !== id));
  }

  // ─── Documents ─────────────────────────────────────────────────────────────
  async function addDocument(projectId, parentId, name, type, fileData = null) {
    const { data: row } = await supabase
      .from('documents')
      .insert({ project_id: projectId, parent_id: parentId || null, name, type, file_data: fileData })
      .select().single();
    const doc = fromDb(row);
    if (doc) setDocuments(prev => [...prev, doc]);
    return doc;
  }

  async function updateDocument(id, data) {
    await supabase.from('documents').update(toDb(data)).eq('id', id);
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  }

  async function deleteDocument(id) {
    await supabase.from('documents').delete().eq('id', id);
    // CASCADE handles children in DB; mirror recursively in local state
    const deleteLocal = (docId, docs) => {
      const children = docs.filter(d => d.parentId === docId);
      let remaining = docs.filter(d => d.id !== docId);
      for (const child of children) remaining = deleteLocal(child.id, remaining);
      return remaining;
    };
    setDocuments(prev => deleteLocal(id, prev));
  }

  async function copyDocument(id, newParentId) {
    const copyRecursive = async (docId, newParentIdArg, allDocs) => {
      const doc = allDocs.find(d => d.id === docId);
      if (!doc) return [];
      const { data: row } = await supabase
        .from('documents')
        .insert({ project_id: doc.projectId, parent_id: newParentIdArg, name: `${doc.name} (copy)`, type: doc.type, file_data: doc.fileData })
        .select().single();
      const newDoc = fromDb(row);
      const children = allDocs.filter(d => d.parentId === docId);
      const childCopies = [];
      for (const c of children) childCopies.push(...await copyRecursive(c.id, newDoc.id, allDocs));
      return [newDoc, ...childCopies];
    };
    const copies = await copyRecursive(id, newParentId, documents);
    setDocuments(prev => [...prev, ...copies]);
  }

  async function moveDocument(id, newParentId) {
    await supabase.from('documents').update({ parent_id: newParentId || null }).eq('id', id);
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, parentId: newParentId || null } : d));
  }

  // ─── Tasks ─────────────────────────────────────────────────────────────────
  async function addTask(projectId, data, userId) {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const maxNum = projectTasks.reduce((m, t) => Math.max(m, t.taskNumber || 0), 0);
    const taskNumber = data.taskNumber || maxNum + 1;
    const { data: row, error } = await supabase
      .from('tasks')
      .insert({ ...toDb(data), project_id: projectId, task_number: taskNumber, status: data.status || 'open' })
      .select().single();
    if (error || !row) { console.error('addTask:', error); return null; }
    const task = fromDb(row);
    setTasks(prev => [...prev, task]);
    addActivity(projectId, 'task', 'created', `Task #${task.taskNumber}: ${task.title}`, userId);
    return task;
  }

  async function updateTask(id, data, userId) {
    await supabase.from('tasks').update(toDb(data)).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    const task = tasks.find(t => t.id === id);
    if (task) addActivity(task.projectId, 'task', 'updated', `Task #${task.taskNumber}: ${task.title} updated`, userId);
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  // ─── RFIs ──────────────────────────────────────────────────────────────────
  async function addRfi(projectId, data, userId) {
    const projectRfis = rfis.filter(r => r.projectId === projectId);
    const maxNum = projectRfis.reduce((m, r) => Math.max(m, r.rfiNumber || 0), 0);
    const rfiNumber = data.rfiNumber || maxNum + 1;
    const payload = { ...toDb(data), project_id: projectId, rfi_number: rfiNumber, responses: data.responses || [] };
    const { data: row, error } = await supabase
      .from('rfis')
      .insert(payload)
      .select().single();
    if (error || !row) { console.error('addRfi:', error); return null; }
    const rfi = fromDb(row);
    // Refetch all rfis so the list reflects the real DB state
    const { data: fresh } = await supabase.from('rfis').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
    setRfis(prev => [...prev.filter(r => r.projectId !== projectId), ...(fresh || []).map(fromDb)]);
    addActivity(projectId, 'rfi', 'created', `RFI #${rfi.rfiNumber}: ${rfi.subject}`, userId);
    return rfi;
  }

  async function updateRfi(id, data, userId) {
    await supabase.from('rfis').update(toDb(data)).eq('id', id);
    setRfis(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    const rfi = rfis.find(r => r.id === id);
    if (rfi) addActivity(rfi.projectId, 'rfi', 'updated', `RFI #${rfi.rfiNumber}: ${rfi.subject} updated`, userId);
  }

  async function addRfiResponse(rfiId, response, userId) {
    const rfi = rfis.find(r => r.id === rfiId);
    if (!rfi) return;
    const newResponse = { id: crypto.randomUUID(), ...response, createdAt: new Date().toISOString() };
    const updatedResponses = [...(rfi.responses || []), newResponse];
    await supabase.from('rfis').update({ responses: updatedResponses }).eq('id', rfiId);
    setRfis(prev => prev.map(r => r.id === rfiId ? { ...r, responses: updatedResponses } : r));
    addActivity(rfi.projectId, 'rfi', 'response', `RFI #${rfi.rfiNumber} received a response`, userId);
  }

  async function deleteRfi(id) {
    await supabase.from('rfis').delete().eq('id', id);
    setRfis(prev => prev.filter(r => r.id !== id));
  }

  // ─── Specifications ─────────────────────────────────────────────────────────
  async function addSpec(projectId, data) {
    const { data: row } = await supabase
      .from('specifications')
      .insert({ ...toDb(data), project_id: projectId })
      .select().single();
    const spec = fromDb(row);
    if (spec) setSpecifications(prev => [...prev, spec]);
    return spec;
  }

  async function updateSpec(id, data) {
    await supabase.from('specifications').update(toDb(data)).eq('id', id);
    setSpecifications(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }

  async function deleteSpec(id) {
    await supabase.from('specifications').delete().eq('id', id);
    setSpecifications(prev => prev.filter(s => s.id !== id));
  }

  // ─── Submittals ─────────────────────────────────────────────────────────────
  async function addSubmittal(projectId, data, userId) {
    const projectSubs = submittals.filter(s => s.projectId === projectId);
    const maxNum = projectSubs.reduce((m, s) => Math.max(m, s.submittalNumber || 0), 0);
    const { data: row, error } = await supabase
      .from('submittals')
      .insert({ ...toDb(data), project_id: projectId, submittal_number: maxNum + 1, status: data.status || 'open' })
      .select().single();
    if (error || !row) { console.error('addSubmittal:', error); return null; }
    const sub = fromDb(row);
    setSubmittals(prev => [...prev, sub]);
    addActivity(projectId, 'submittal', 'created', `Submittal #${sub.submittalNumber}: ${sub.title}`, userId);
    return sub;
  }

  async function updateSubmittal(id, data, userId) {
    await supabase.from('submittals').update(toDb(data)).eq('id', id);
    setSubmittals(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    const sub = submittals.find(s => s.id === id);
    if (sub) addActivity(sub.projectId, 'submittal', 'updated', `Submittal #${sub.submittalNumber} updated`, userId);
  }

  async function deleteSubmittal(id) {
    await supabase.from('submittals').delete().eq('id', id);
    setSubmittals(prev => prev.filter(s => s.id !== id));
  }

  return (
    <DataContext.Provider value={{
      dataLoading,
      projects, projectMembers, dirUsers, dirCompanies, distGroups,
      documents, tasks, rfis, submittals, activityFeed,
      addProject, updateProject, deleteProject,
      addProjectMember, removeProjectMember, getProjectRole, getUserProjects,
      addDirUser, updateDirUser, deleteDirUser,
      addDirCompany, updateDirCompany, deleteDirCompany,
      addDistGroup, updateDistGroup, deleteDistGroup,
      setDirUsers, setDirCompanies, setDistGroups,
      addDocument, updateDocument, deleteDocument, copyDocument, moveDocument,
      addTask, updateTask, deleteTask,
      addRfi, updateRfi, addRfiResponse, deleteRfi,
      addSubmittal, updateSubmittal, deleteSubmittal,
      specifications, addSpec, updateSpec, deleteSpec,
      addActivity,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
