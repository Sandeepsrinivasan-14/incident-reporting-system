const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// GET all incidents
app.get('/api/incidents', async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany();
    res.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// GET incidents by reporter user ID
app.get('/api/incidents/reporter/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const incidents = await prisma.incident.findMany({
      where: { reporterUserId: parseInt(userId) }
    });
    res.json(incidents);
  } catch (error) {
    console.error('Error fetching reporter incidents:', error);
    res.status(500).json({ error: 'Failed to fetch reporter incidents' });
  }
});

// POST create incident
app.post('/api/incidents', async (req, res) => {
  try {
    const { title, description, severity, reporterUserId } = req.body;
    
    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        severity,
        reporterUserId: parseInt(reporterUserId),
        status: 'open'
      }
    });
    
    res.json(incident);
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// PUT update incident status
app.put('/api/incidents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolverId } = req.body;
    
    const incident = await prisma.incident.update({
      where: { id: parseInt(id) },
      data: {
        status,
        resolverUserId: resolverId ? parseInt(resolverId) : undefined
      }
    });
    
    res.json(incident);
  } catch (error) {
    console.error('Error updating incident:', error);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});
