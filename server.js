// ============================================================
//  server.js  — Express backend for Tamilselvam's Portfolio
//  Uses sql.js (pure JS SQLite — no Visual Studio needed)
//  Run: npm install   then   npm start
//  Open: http://localhost:3000
// ============================================================

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const path       = require('path');
const { initDB, helpers } = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// ── Start server only after DB is ready ──
initDB().then(() => {

  // ─────────────────────────────────────
  //  LOAD ALL DATA AT ONCE
  // ─────────────────────────────────────
  app.get('/api/data', (req, res) => {
    try {
      res.json({
        certifications:  helpers.getCerts(),
        experience:      helpers.getExp(),
        projects:        helpers.getProjects(),
        skillGroups:     helpers.getSkillGroups(),
        roadmapProgress: helpers.getRoadmapProgress(),
      });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ─────────────────────────────────────
  //  CERTIFICATIONS
  // ─────────────────────────────────────
  app.get('/api/certifications', (req, res) => res.json(helpers.getCerts()));

  app.post('/api/certifications', (req, res) => {
    try { res.json({ success: true, cert: helpers.addCert(req.body) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/certifications/:id', (req, res) => {
    try { res.json({ success: true, cert: helpers.updateCert(req.params.id, req.body) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/certifications/:id', (req, res) => {
    try { helpers.deleteCert(req.params.id); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ─────────────────────────────────────
  //  EXPERIENCE
  // ─────────────────────────────────────
  app.get('/api/experience', (req, res) => res.json(helpers.getExp()));

  app.post('/api/experience', (req, res) => {
    try { res.json({ success: true, exp: helpers.addExp(req.body) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/experience/:id', (req, res) => {
    try { res.json({ success: true, exp: helpers.updateExp(req.params.id, req.body) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/experience/:id', (req, res) => {
    try { helpers.deleteExp(req.params.id); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ─────────────────────────────────────
  //  PROJECTS
  // ─────────────────────────────────────
  app.get('/api/projects', (req, res) => res.json(helpers.getProjects()));

  app.post('/api/projects', (req, res) => {
    try { res.json({ success: true, project: helpers.addProject(req.body) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/projects/:id', (req, res) => {
    try { res.json({ success: true, project: helpers.updateProject(req.params.id, req.body) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/projects/:id', (req, res) => {
    try { helpers.deleteProject(req.params.id); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ─────────────────────────────────────
  //  SKILLS
  // ─────────────────────────────────────
  app.get('/api/skills', (req, res) => res.json(helpers.getSkillGroups()));

  app.post('/api/skills/groups', (req, res) => {
    try { res.json({ success: true, group: helpers.addSkillGroup(req.body.title) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/skills/groups/:id', (req, res) => {
    try { helpers.updateSkillGroup(req.params.id, req.body.title); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/skills/groups/:id', (req, res) => {
    try { helpers.deleteSkillGroup(req.params.id); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/skills/tags', (req, res) => {
    try { res.json({ success: true, tag: helpers.addSkillTag(req.body.group_id, req.body.tag) }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/skills/tags/:id', (req, res) => {
    try { helpers.deleteSkillTag(req.params.id); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ─────────────────────────────────────
  //  ROADMAP
  // ─────────────────────────────────────
  app.get('/api/roadmap', (req, res) => res.json(helpers.getRoadmapProgress()));

  app.post('/api/roadmap/day', (req, res) => {
    try { helpers.setDayStatus(req.body.day, req.body.status); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/roadmap/reset', (req, res) => {
    try { helpers.resetRoadmap(); res.json({ success: true }); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ─────────────────────────────────────
  //  SERVE portfolio.html FOR ALL ROUTES
  // ─────────────────────────────────────
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'portfolio.html'));
  });

  app.listen(PORT, () => {
    console.log('\n✅  Portfolio running at → http://localhost:' + PORT);
    console.log('📦  Database saved at   → ' + path.join(__dirname, 'data', 'portfolio.db'));
    console.log('🔑  Admin password      → Tamil@2025\n');
  });

}).catch(err => {
  console.error('❌  Failed to start:', err.message);
  process.exit(1);
});
