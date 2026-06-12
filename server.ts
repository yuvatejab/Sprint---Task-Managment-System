import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

import { db } from './src/db.js'; // Ensure .js path mapping or ts import
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';

const app = express();
const PORT = 3000;

// Resolve path coordinates safely in both ESM and CJS contexts
const resolvedFilename = typeof import.meta !== 'undefined' && import.meta.url 
  ? fileURLToPath(import.meta.url) 
  : (typeof __filename !== 'undefined' ? __filename : '');

const resolvedDirname = typeof import.meta !== 'undefined' && import.meta.url 
  ? path.dirname(resolvedFilename) 
  : (typeof __dirname !== 'undefined' ? __dirname : '');

app.use(express.json({ limit: '10mb' })); // support file attachments/base64

const JWT_SECRET = process.env.JWT_SECRET || 'task-management-premium-secret-key-2026';

// Error Handler helper according to Firebase skill requirements
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, collPath: string | null, userId?: string, email?: string) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId || null,
      email: email || null,
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path: collPath
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------------------------------------------
// Authentication Middleware
// ----------------------------------------------------
interface AuthUser {
  uid: string;
  email: string;
  role: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication token is required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Token is invalid or expired' });
      return;
    }
    req.user = decoded as AuthUser;
    next();
  });
}

// ----------------------------------------------------
// Auth Routes
// ----------------------------------------------------

// POST /api/auth/signup - Register a new user
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, role } = req.body;

  // Basic input validation
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email address is required' });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long' });
    return;
  }

  try {
    // Check if user already exists
    const userRef = doc(db, 'users', email.toLowerCase());
    let existingUserDoc;
    try {
      existingUserDoc = await getDoc(userRef);
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.GET, 'users');
    }

    if (existingUserDoc.exists()) {
      res.status(400).json({ error: 'A user with this email already exists' });
      return;
    }

    // Determine role - default user, check if match admin boostrap
    // Automatically make 'ybandharapu@gmail.com' an admin
    let userRole: 'user' | 'admin' = 'user';
    if (email.toLowerCase() === 'ybandharapu@gmail.com') {
      userRole = 'admin';
    } else if (role === 'admin' || role === 'user') {
      userRole = role;
    }

    const uid = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    const newUser = {
      uid,
      email: email.toLowerCase(),
      role: userRole,
      passwordHash,
      createdAt
    };

    // Store in Firestore
    try {
      await setDoc(userRef, newUser);
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.CREATE, 'users', uid, email);
    }

    // Generate JWT Web Token
    const userPayload: AuthUser = { uid, email: email.toLowerCase(), role: userRole };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        uid,
        email: email.toLowerCase(),
        role: userRole,
        createdAt
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during registration' });
  }
});

// POST /api/auth/login - User Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  try {
    const userRef = doc(db, 'users', email.toLowerCase());
    let userDoc;
    try {
      userDoc = await getDoc(userRef);
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.GET, 'users');
    }

    if (!userDoc.exists()) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const userData = userDoc.data();
    const isPasswordMatch = await bcrypt.compare(password, userData.passwordHash);

    if (!isPasswordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const userPayload: AuthUser = { 
      uid: userData.uid, 
      email: userData.email, 
      role: userData.role 
    };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        uid: userData.uid,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during authentication' });
  }
});


// ----------------------------------------------------
// Tasks CRUD API
// ----------------------------------------------------

// POST /api/tasks - Create a Task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description, status, priority, dueDate } = req.body;

  // Title validation
  if (!title || typeof title !== 'string' || title.trim() === '') {
    res.status(400).json({ error: 'Task title is required and cannot be empty' });
    return;
  }

  // Validate status
  const validStatuses = ['todo', 'in-progress', 'completed'];
  const taskStatus = status && validStatuses.includes(status) ? status : 'todo';

  // Validate priority
  const validPriorities = ['low', 'medium', 'high'];
  const taskPriority = priority && validPriorities.includes(priority) ? priority : 'medium';

  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 7); // Default to 1 week from now
  const taskDueDate = dueDate ? new Date(dueDate).toISOString() : defaultDueDate.toISOString();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const taskActivity = {
    id: crypto.randomUUID(),
    action: 'created',
    details: `Task was created by ${req.user!.email}`,
    userEmail: req.user!.email,
    timestamp: now
  };

  const newTask = {
    id,
    userId: req.user!.uid,
    userEmail: req.user!.email,
    title: title.trim(),
    description: (description || '').trim(),
    status: taskStatus,
    priority: taskPriority,
    dueDate: taskDueDate,
    createdAt: now,
    updatedAt: now,
    activities: [taskActivity],
    attachments: []
  };

  try {
    try {
      await setDoc(doc(db, 'tasks', id), newTask);
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.WRITE, `tasks/${id}`, req.user?.uid, req.user?.email);
    }
    res.status(201).json(newTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

// GET /api/tasks - List tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
  const { 
    status, 
    priority, 
    search, 
    sortBy = 'createdAt', 
    sortOrder = 'desc', 
    page = '1', 
    limit = '10' 
  } = req.query;

  try {
    const tasksRef = collection(db, 'tasks');
    let dbQuery;

    // Admin can query everything, non-admin only sees their own
    if (req.user!.role === 'admin') {
      dbQuery = tasksRef;
    } else {
      dbQuery = query(tasksRef, where('userId', '==', req.user!.uid));
    }

    let querySnapshot;
    try {
      querySnapshot = await getDocs(dbQuery);
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.LIST, 'tasks', req.user?.uid, req.user?.email);
    }

    let allTasks: any[] = [];
    querySnapshot.forEach(doc => {
      allTasks.push(doc.data());
    });

    // --- Server-side Filtering ---
    if (status && typeof status === 'string' && status !== 'all') {
      allTasks = allTasks.filter(t => t.status === status);
    }

    if (priority && typeof priority === 'string' && priority !== 'all') {
      allTasks = allTasks.filter(t => t.priority === priority);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const querySearch = search.toLowerCase().trim();
      allTasks = allTasks.filter(t => 
        (t.title || '').toLowerCase().includes(querySearch) ||
        (t.description || '').toLowerCase().includes(querySearch)
      );
    }

    // --- Server-side Sorting ---
    const sortByField = sortBy as string;
    const desc = sortOrder === 'desc';

    allTasks.sort((a, b) => {
      let valA = a[sortByField];
      let valB = b[sortByField];

      // Special custom rank for Priority sorting
      if (sortByField === 'priority') {
        const priorityRank = { high: 3, medium: 2, low: 1 };
        valA = priorityRank[a.priority as keyof typeof priorityRank] || 0;
        valB = priorityRank[b.priority as keyof typeof priorityRank] || 0;
      }

      if (valA === undefined) return 1;
      if (valB === undefined) return -1;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return desc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }

      return desc ? (valB - valA) : (valA - valB);
    });

    // --- Pagination ---
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.max(1, parseInt(limit as string) || 10);
    const totalTasks = allTasks.length;
    const totalPages = Math.ceil(totalTasks / limitNum);

    const startIndex = (pageNum - 1) * limitNum;
    const paginatedTasks = allTasks.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      tasks: paginatedTasks,
      totalTasks,
      totalPages,
      currentPage: pageNum,
      limit: limitNum
    });
  } catch (error: any) {
    console.error('List tasks error:', error);
    res.status(500).json({ error: error.message || 'Failed to list tasks' });
  }
});

// GET /api/tasks/:id - Fetch single task
app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const taskRef = doc(db, 'tasks', id);
    let taskDoc;
    try {
      taskDoc = await getDoc(taskRef);
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.GET, `tasks/${id}`, req.user?.uid, req.user?.email);
    }

    if (!taskDoc.exists()) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = taskDoc.data();

    // Verification - ownership or admin
    if (req.user!.role !== 'admin' && task.userId !== req.user!.uid) {
      res.status(403).json({ error: 'Access denied: You do not own this task' });
      return;
    }

    res.status(200).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve task' });
  }
});

// PATCH /api/tasks/:id - Update Task and Log Activity
app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, dueDate, attachments } = req.body;

  try {
    const taskRef = doc(db, 'tasks', id);
    let taskDoc;
    try {
      taskDoc = await getDoc(taskRef);
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.GET, `tasks/${id}`, req.user?.uid, req.user?.email);
    }

    if (!taskDoc.exists()) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const existingTask = taskDoc.data();

    // Verify ownership or check if Admin
    if (req.user!.role !== 'admin' && existingTask.userId !== req.user!.uid) {
      res.status(403).json({ error: 'Access denied: You are not authorized to update this task' });
      return;
    }

    const updates: any = {};
    const activitiesList = [...(existingTask.activities || [])];
    const userEmail = req.user!.email;
    const now = new Date().toISOString();

    if (title !== undefined && title.trim() !== '') {
      const trimmedTitle = title.trim();
      if (trimmedTitle !== existingTask.title) {
        activitiesList.push({
          id: crypto.randomUUID(),
          action: 'title_updated',
          details: `Title updated from "${existingTask.title}" to "${trimmedTitle}"`,
          userEmail,
          timestamp: now
        });
        updates.title = trimmedTitle;
      }
    }

    if (description !== undefined) {
      const trimmedDesc = description.trim();
      if (trimmedDesc !== existingTask.description) {
        activitiesList.push({
          id: crypto.randomUUID(),
          action: 'description_updated',
          details: `Description was changed`,
          userEmail,
          timestamp: now
        });
        updates.description = trimmedDesc;
      }
    }

    if (status !== undefined) {
      const validStatuses = ['todo', 'in-progress', 'completed'];
      if (validStatuses.includes(status) && status !== existingTask.status) {
        activitiesList.push({
          id: crypto.randomUUID(),
          action: 'status_updated',
          details: `Status changed from "${existingTask.status}" to "${status}"`,
          userEmail,
          timestamp: now
        });
        updates.status = status;
      }
    }

    if (priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high'];
      if (validPriorities.includes(priority) && priority !== existingTask.priority) {
        activitiesList.push({
          id: crypto.randomUUID(),
          action: 'priority_updated',
          details: `Priority changed from "${existingTask.priority}" to "${priority}"`,
          userEmail,
          timestamp: now
        });
        updates.priority = priority;
      }
    }

    if (dueDate !== undefined) {
      const formattedDueDate = new Date(dueDate).toISOString();
      if (formattedDueDate !== existingTask.dueDate) {
        activitiesList.push({
          id: crypto.randomUUID(),
          action: 'duedate_updated',
          details: `Due date changed to ${new Date(formattedDueDate).toLocaleDateString()}`,
          userEmail,
          timestamp: now
        });
        updates.dueDate = formattedDueDate;
      }
    }

    if (attachments !== undefined) {
      activitiesList.push({
        id: crypto.randomUUID(),
        action: 'attachments_updated',
        details: `Task attachments were modified`,
        userEmail,
        timestamp: now
      });
      updates.attachments = attachments;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = now;
      updates.activities = activitiesList;

      try {
        await updateDoc(taskRef, updates);
      } catch (dbErr) {
        return handleFirestoreError(dbErr, OperationType.UPDATE, `tasks/${id}`, req.user?.uid, req.user?.email);
      }
    }

    // Get the final fully loaded updated document to return
    const updatedDoc = await getDoc(taskRef);
    res.status(200).json(updatedDoc.data());
  } catch (error: any) {
    console.error('Update task error:', error);
    res.status(500).json({ error: error.message || 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete Task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const taskRef = doc(db, 'tasks', id);
    let taskDoc;
    try {
      taskDoc = await getDoc(taskRef);
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.GET, `tasks/${id}`, req.user?.uid, req.user?.email);
    }

    if (!taskDoc.exists()) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = taskDoc.data();

    // Ownership or admin check
    if (req.user!.role !== 'admin' && task.userId !== req.user!.uid) {
      res.status(403).json({ error: 'Access denied: You are not authorized to delete this task' });
      return;
    }

    try {
      await deleteDoc(taskRef);
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.DELETE, `tasks/${id}`, req.user?.uid, req.user?.email);
    }

    res.status(200).json({ message: 'Task deleted successfully', id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/attachments - Uplload attachment (Base64 file)
app.post('/api/tasks/:id/attachments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, url, type } = req.body;

  if (!name || !url || !type) {
    res.status(400).json({ error: 'Attachment name, url, and type are required' });
    return;
  }

  try {
    const taskRef = doc(db, 'tasks', id);
    let taskDoc;
    try {
      taskDoc = await getDoc(taskRef);
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.GET, `tasks/${id}`, req.user?.uid, req.user?.email);
    }

    if (!taskDoc.exists()) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = taskDoc.data();

    if (req.user!.role !== 'admin' && task.userId !== req.user!.uid) {
      res.status(403).json({ error: 'Access denied: You are not authorized to update this task' });
      return;
    }

    const newAttachment = {
      id: crypto.randomUUID(),
      name,
      url,
      type,
      uploadedAt: new Date().toISOString()
    };

    const attachments = [...(task.attachments || []), newAttachment];
    const activities = [...(task.activities || [])];
    const now = new Date().toISOString();

    activities.push({
      id: crypto.randomUUID(),
      action: 'attachment_added',
      details: `Added file attachment: "${name}"`,
      userEmail: req.user!.email,
      timestamp: now
    });

    try {
      await updateDoc(taskRef, {
        attachments,
        activities,
        updatedAt: now
      });
    } catch (dbErr) {
      return handleFirestoreError(dbErr, OperationType.UPDATE, `tasks/${id}`, req.user?.uid, req.user?.email);
    }

    res.status(200).json(newAttachment);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to attach file' });
  }
});


// ----------------------------------------------------
// Mounting Vite Frontend Middleware
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Success! Tasks Board API running at http://localhost:${PORT}`);
  });
}

startServer();
