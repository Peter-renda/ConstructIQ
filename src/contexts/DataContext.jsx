import { createContext, useContext, useState, useCallback } from 'react';

const DataContext = createContext(null);

function load(key, def = []) {
  try {
    const val = localStorage.getItem(`constructiq_${key}`);
    return val ? JSON.parse(val) : def;
  } catch { return def; }
}

function save(key, val) {
  localStorage.setItem(`constructiq_${key}`, JSON.stringify(val));
}

function useLocalState(key, def = []) {
  const [state, setState] = useState(() => load(key, def));
  const update = useCallback((fn) => {
    setState(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      save(key, next);
      return next;
    });
  }, [key]);
  return [state, update];
}

export function DataProvider({ children }) {
  const [projects, setProjects] = useLocalState('projects');
  const [projectMembers, setProjectMembers] = useLocalState('projectMembers');
  const [dirUsers, setDirUsers] = useLocalState('dirUsers');
  const [dirCompanies, setDirCompanies] = useLocalState('dirCompanies');
  const [distGroups, setDistGroups] = useLocalState('distGroups');
  const [documents, setDocuments] = useLocalState('documents');
  const [tasks, setTasks] = useLocalState('tasks');
  const [rfis, setRfis] = useLocalState('rfis');
  const [submittals, setSubmittals] = useLocalState('submittals');
  const [specifications, setSpecifications] = useLocalState('specifications');
  const [activityFeed, setActivityFeed] = useLocalState('activityFeed');

  function addActivity(projectId, type, action, details, userId) {
    const entry = {
      id: crypto.randomUUID(),
      projectId,
      type,
      action,
      details,
      userId,
      createdAt: new Date().toISOString(),
    };
    setActivityFeed(prev => [entry, ...prev.slice(0, 499)]);
    return entry;
  }

  // ─── Projects ──────────────────────────────────────
  function addProject(data, userId) {
    const p = { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() };
    setProjects(prev => [...prev, p]);
    // Auto-add creator as project admin
    if (userId) {
      setProjectMembers(prev => [...prev, { id: crypto.randomUUID(), projectId: p.id, userId, role: 'administrator' }]);
    }
    addActivity(p.id, 'project', 'created', `Project "${p.name}" created`, userId);
    return p;
  }

  function updateProject(id, data, userId) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    addActivity(id, 'project', 'updated', `Project information updated`, userId);
  }

  function deleteProject(id) {
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

  // ─── Project Members ────────────────────────────────
  function addProjectMember(projectId, userId, role) {
    const existing = projectMembers.find(m => m.projectId === projectId && m.userId === userId);
    if (existing) {
      setProjectMembers(prev => prev.map(m =>
        m.projectId === projectId && m.userId === userId ? { ...m, role } : m
      ));
    } else {
      setProjectMembers(prev => [...prev, { id: crypto.randomUUID(), projectId, userId, role }]);
    }
  }

  function removeProjectMember(projectId, userId) {
    setProjectMembers(prev => prev.filter(m => !(m.projectId === projectId && m.userId === userId)));
  }

  function getProjectRole(projectId, userId) {
    return projectMembers.find(m => m.projectId === projectId && m.userId === userId)?.role;
  }

  function getUserProjects(userId) {
    const memberProjectIds = new Set(projectMembers.filter(m => m.userId === userId).map(m => m.projectId));
    return projects.filter(p => memberProjectIds.has(p.id));
  }

  // ─── Directory ─────────────────────────────────────
  function addDirUser(projectId, data) {
    const u = { id: crypto.randomUUID(), projectId, ...data, createdAt: new Date().toISOString() };
    setDirUsers(prev => [...prev, u]);
    return u;
  }

  function updateDirUser(id, data) {
    setDirUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  }

  function deleteDirUser(id) {
    setDirUsers(prev => prev.filter(u => u.id !== id));
  }

  function addDirCompany(projectId, data) {
    const c = { id: crypto.randomUUID(), projectId, ...data, createdAt: new Date().toISOString() };
    setDirCompanies(prev => [...prev, c]);
    return c;
  }

  function updateDirCompany(id, data) {
    setDirCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }

  function deleteDirCompany(id) {
    setDirCompanies(prev => prev.filter(c => c.id !== id));
  }

  function addDistGroup(projectId, data) {
    const g = { id: crypto.randomUUID(), projectId, ...data, createdAt: new Date().toISOString() };
    setDistGroups(prev => [...prev, g]);
    return g;
  }

  function updateDistGroup(id, data) {
    setDistGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
  }

  function deleteDistGroup(id) {
    setDistGroups(prev => prev.filter(g => g.id !== id));
  }

  // ─── Documents ─────────────────────────────────────
  function addDocument(projectId, parentId, name, type, fileData = null) {
    const doc = {
      id: crypto.randomUUID(),
      projectId,
      parentId: parentId || null,
      name,
      type,
      fileData,
      createdAt: new Date().toISOString(),
    };
    setDocuments(prev => [...prev, doc]);
    return doc;
  }

  function updateDocument(id, data) {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  }

  function deleteDocument(id) {
    const deleteRecursive = (docId, docs) => {
      const children = docs.filter(d => d.parentId === docId);
      let remaining = docs.filter(d => d.id !== docId);
      for (const child of children) {
        remaining = deleteRecursive(child.id, remaining);
      }
      return remaining;
    };
    setDocuments(prev => deleteRecursive(id, prev));
  }

  function copyDocument(id, newParentId) {
    const copyRecursive = (docId, newParentIdArg, allDocs) => {
      const doc = allDocs.find(d => d.id === docId);
      if (!doc) return [];
      const newId = crypto.randomUUID();
      const newDoc = { ...doc, id: newId, parentId: newParentIdArg, name: `${doc.name} (copy)`, createdAt: new Date().toISOString() };
      const children = allDocs.filter(d => d.parentId === docId);
      const childCopies = children.flatMap(c => copyRecursive(c.id, newId, allDocs));
      return [newDoc, ...childCopies];
    };
    setDocuments(prev => [...prev, ...copyRecursive(id, newParentId, prev)]);
  }

  function moveDocument(id, newParentId) {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, parentId: newParentId || null } : d));
  }

  // ─── Tasks ─────────────────────────────────────────
  function addTask(projectId, data, userId) {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const maxNum = projectTasks.reduce((m, t) => Math.max(m, t.taskNumber || 0), 0);
    const task = {
      id: crypto.randomUUID(),
      projectId,
      taskNumber: data.taskNumber || maxNum + 1,
      status: 'open',
      ...data,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, task]);
    addActivity(projectId, 'task', 'created', `Task #${task.taskNumber}: ${task.title}`, userId);
    return task;
  }

  function updateTask(id, data, userId) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    const task = tasks.find(t => t.id === id);
    if (task) addActivity(task.projectId, 'task', 'updated', `Task #${task.taskNumber}: ${task.title} updated`, userId);
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  // ─── RFIs ──────────────────────────────────────────
  function addRfi(projectId, data, userId) {
    const projectRfis = rfis.filter(r => r.projectId === projectId);
    const maxNum = projectRfis.reduce((m, r) => Math.max(m, r.rfiNumber || 0), 0);
    const rfi = {
      id: crypto.randomUUID(),
      projectId,
      rfiNumber: data.rfiNumber || maxNum + 1,
      responses: [],
      ...data,
      createdAt: new Date().toISOString(),
    };
    setRfis(prev => [...prev, rfi]);
    addActivity(projectId, 'rfi', 'created', `RFI #${rfi.rfiNumber}: ${rfi.subject}`, userId);
    return rfi;
  }

  function updateRfi(id, data, userId) {
    setRfis(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    const rfi = rfis.find(r => r.id === id);
    if (rfi) addActivity(rfi.projectId, 'rfi', 'updated', `RFI #${rfi.rfiNumber}: ${rfi.subject} updated`, userId);
  }

  function addRfiResponse(rfiId, response, userId) {
    const rfi = rfis.find(r => r.id === rfiId);
    setRfis(prev => prev.map(r => r.id === rfiId ? {
      ...r,
      responses: [...(r.responses || []), {
        id: crypto.randomUUID(),
        ...response,
        createdAt: new Date().toISOString(),
      }]
    } : r));
    if (rfi) addActivity(rfi.projectId, 'rfi', 'response', `RFI #${rfi.rfiNumber} received a response`, userId);
  }

  function deleteRfi(id) {
    setRfis(prev => prev.filter(r => r.id !== id));
  }

  // ─── Specifications ─────────────────────────────────
  function addSpec(projectId, data) {
    const spec = { id: crypto.randomUUID(), projectId, ...data, createdAt: new Date().toISOString() };
    setSpecifications(prev => [...prev, spec]);
    return spec;
  }

  function updateSpec(id, data) {
    setSpecifications(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }

  function deleteSpec(id) {
    setSpecifications(prev => prev.filter(s => s.id !== id));
  }

  // ─── Submittals ────────────────────────────────────
  function addSubmittal(projectId, data, userId) {
    const projectSubs = submittals.filter(s => s.projectId === projectId);
    const maxNum = projectSubs.reduce((m, s) => Math.max(m, s.submittalNumber || 0), 0);
    const sub = {
      id: crypto.randomUUID(),
      projectId,
      submittalNumber: maxNum + 1,
      status: 'open',
      ...data,
      createdAt: new Date().toISOString(),
    };
    setSubmittals(prev => [...prev, sub]);
    addActivity(projectId, 'submittal', 'created', `Submittal #${sub.submittalNumber}: ${sub.title}`, userId);
    return sub;
  }

  function updateSubmittal(id, data, userId) {
    setSubmittals(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    const sub = submittals.find(s => s.id === id);
    if (sub) addActivity(sub.projectId, 'submittal', 'updated', `Submittal #${sub.submittalNumber} updated`, userId);
  }

  function deleteSubmittal(id) {
    setSubmittals(prev => prev.filter(s => s.id !== id));
  }

  return (
    <DataContext.Provider value={{
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
