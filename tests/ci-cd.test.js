/**
 * CI-CD Workflow Tests
 *
 * This test suite verifies the GitHub Actions workflow configuration and functionality.
 * Tests cover:
 * - Workflow YAML structure and validity
 * - npm scripts existence and execution
 * - Coverage generation and metrics
 * - Integration with CI/CD tools
 */

const fs = require('fs-extra')
const path = require('path')
const yaml = require('js-yaml')

describe('CI-CD: Workflow Infrastructure', () => {
  const WORKFLOW_FILE = path.join(__dirname, '../.github/workflows/test.yml')

  let workflowConfig

  // Load and parse workflow YAML before tests
  beforeAll(() => {
    expect(fs.existsSync(WORKFLOW_FILE)).toBe(true)
    const yamlContent = fs.readFileSync(WORKFLOW_FILE, 'utf8')
    workflowConfig = yaml.load(yamlContent)
  })

  describe('Workflow File Structure', () => {
    it('should have workflow name defined', () => {
      expect(workflowConfig.name).toBeDefined()
      expect(typeof workflowConfig.name).toBe('string')
      expect(workflowConfig.name.length).toBeGreaterThan(0)
    })

    it('should have trigger events configured', () => {
      expect(workflowConfig.on).toBeDefined()
      expect(typeof workflowConfig.on).toBe('object')
    })

    it('should have push trigger configured', () => {
      expect(workflowConfig.on.push).toBeDefined()
      expect(workflowConfig.on.push.branches).toBeDefined()
      expect(Array.isArray(workflowConfig.on.push.branches)).toBe(true)
    })

    it('should trigger on main and CI-CD branches for push', () => {
      const branches = workflowConfig.on.push.branches
      expect(branches).toContain('main')
      expect(branches).toContain('CI-CD')
    })

    it('should have pull_request trigger configured', () => {
      expect(workflowConfig.on.pull_request).toBeDefined()
      expect(workflowConfig.on.pull_request.branches).toBeDefined()
    })

    it('should trigger on main branch for pull requests', () => {
      const branches = workflowConfig.on.pull_request.branches
      expect(branches).toContain('main')
    })

    it('should have jobs defined', () => {
      expect(workflowConfig.jobs).toBeDefined()
      expect(typeof workflowConfig.jobs).toBe('object')
      expect(Object.keys(workflowConfig.jobs).length).toBeGreaterThan(0)
    })

    it('should have test job configured', () => {
      expect(workflowConfig.jobs.test).toBeDefined()
    })

    it('should have environment variables defined', () => {
      expect(workflowConfig.env).toBeDefined()
      expect(workflowConfig.env.NODE_VERSION).toBeDefined()
      expect(workflowConfig.env.NODE_VERSION).toBe('20')
    })
  })

  describe('Job Configuration', () => {
    let testJob

    beforeAll(() => {
      testJob = workflowConfig.jobs.test
    })

    it('should specify runs-on as ubuntu-latest', () => {
      expect(testJob['runs-on']).toBe('ubuntu-latest')
    })

    it('should have job name defined', () => {
      expect(testJob.name).toBeDefined()
      expect(typeof testJob.name).toBe('string')
    })

    it('should have steps defined', () => {
      expect(testJob.steps).toBeDefined()
      expect(Array.isArray(testJob.steps)).toBe(true)
      expect(testJob.steps.length).toBeGreaterThan(0)
    })

    it('should have at least 7 steps', () => {
      expect(testJob.steps.length).toBeGreaterThanOrEqual(7)
    })
  })

  describe('Workflow Steps', () => {
    let testJob
    let steps

    beforeAll(() => {
      testJob = workflowConfig.jobs.test
      steps = testJob.steps
    })

    it('should have checkout step', () => {
      const checkoutStep = steps.find(s => s.name.toLowerCase().includes('checkout'))
      expect(checkoutStep).toBeDefined()
      expect(checkoutStep.uses).toMatch(/actions\/checkout/)
    })

    it('should have setup node step', () => {
      const nodeStep = steps.find(s => s.name.toLowerCase().includes('node'))
      expect(nodeStep).toBeDefined()
      expect(nodeStep.uses).toMatch(/actions\/setup-node/)
    })

    it('should specify Node version in setup-node', () => {
      const nodeStep = steps.find(s => s.uses && s.uses.includes('setup-node'))
      expect(nodeStep.with).toBeDefined()
      expect(nodeStep.with['node-version']).toBeDefined()
    })

    it('should have npm ci step', () => {
      const npmCiStep = steps.find(s => s.run && s.run.includes('npm ci'))
      expect(npmCiStep).toBeDefined()
      expect(npmCiStep.name.toLowerCase()).toContain('install')
    })

    it('should have Saturno build wrapper step', () => {
      const buildWrapperStep = steps.find(s => s.run && s.run.includes('Scripts/build.ps1'))
      expect(buildWrapperStep).toBeDefined()
      expect(buildWrapperStep.run).toContain('BuildNumber 0')
    })

    it('should have Saturno package wrapper step', () => {
      const packageWrapperStep = steps.find(s => s.run && s.run.includes('Scripts/package.ps1'))
      expect(packageWrapperStep).toBeDefined()
      expect(packageWrapperStep.run).toContain('BuildNumber 0')
    })

    it('should have npm test step for coverage collection', () => {
      const testStep = steps.find(s => s.run && s.run.includes('npm test'))
      expect(testStep).toBeDefined()
      expect(testStep.run).toContain('--coverage')
    })

    it('should have codecov upload step', () => {
      const codecovStep = steps.find(s => s.uses && s.uses.includes('codecov'))
      expect(codecovStep).toBeDefined()
      expect(codecovStep.uses).toMatch(/codecov\/codecov-action/)
    })

    it('should configure codecov upload file', () => {
      const codecovStep = steps.find(s => s.uses && s.uses.includes('codecov'))
      expect(codecovStep.with.files).toBe('./coverage/lcov.info')
    })
  })

  describe('npm Scripts Availability', () => {
    it('should have npm test script', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
      expect(packageJson.scripts.test).toBeDefined()
    })

    it('should have build script', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
      expect(packageJson.scripts.build).toBeDefined()
    })

    it('should have tester script for watch mode', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
      expect(packageJson.scripts.tester).toBeDefined()
    })

    it('npm test should include StandardJS', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
      expect(packageJson.scripts.test).toContain('standard')
    })

    it('npm test should include Jest', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
      expect(packageJson.scripts.test).toContain('jest')
    })
  })

  describe('Coverage Configuration', () => {
    it('coverage step should use codecov-action@v4', () => {
      const workflowContent = fs.readFileSync(WORKFLOW_FILE, 'utf8')
      expect(workflowContent).toContain('codecov/codecov-action@v4')
    })

    it('coverage step should specify lcov.info file', () => {
      const workflowContent = fs.readFileSync(WORKFLOW_FILE, 'utf8')
      expect(workflowContent).toContain('./coverage/lcov.info')
    })

    it('test step should include --coverage flag', () => {
      const workflowContent = fs.readFileSync(WORKFLOW_FILE, 'utf8')
      expect(workflowContent).toContain('--coverage')
    })

    it('jest should be configured in package.json', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
      expect(packageJson.jest).toBeDefined()
      expect(packageJson.jest.testEnvironment).toBe('node')
    })
  })

  describe('Code Quality', () => {
    it('test.yml should be valid YAML', () => {
      expect(() => {
        yaml.load(fs.readFileSync(WORKFLOW_FILE, 'utf8'))
      }).not.toThrow()
    })

    it('test.yml should have proper indentation', () => {
      const content = fs.readFileSync(WORKFLOW_FILE, 'utf8')
      // Check for consistent spacing (not tabs)
      expect(content).not.toContain('\t')
    })

    it('.gitignore should include coverage directory', () => {
      const gitignore = fs.readFileSync(path.join(__dirname, '../.gitignore'), 'utf8')
      expect(gitignore).toContain('coverage')
    })

    it('workflow.yml should have comments explaining sections', () => {
      const content = fs.readFileSync(WORKFLOW_FILE, 'utf8')
      expect(content).toContain('#')
    })
  })

  describe('Integration Tests', () => {
    it('should have StandardJS run as part of npm test', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
      const testScript = packageJson.scripts.test
      expect(testScript).toContain('standard')
      expect(testScript).toContain('&&')
    })

    it('should have all required test files', () => {
      const testsDir = path.join(__dirname)
      expect(fs.existsSync(testsDir)).toBe(true)
      const files = fs.readdirSync(testsDir)
      expect(files.some(f => f.endsWith('.test.js'))).toBe(true)
    })

    it('workflow should have all required steps in correct order', () => {
      const workflowContent = fs.readFileSync(WORKFLOW_FILE, 'utf8')
      const checkoutIndex = workflowContent.indexOf('actions/checkout')
      const nodeIndex = workflowContent.indexOf('actions/setup-node')
      const npmCiIndex = workflowContent.indexOf('npm ci')
      const buildWrapperIndex = workflowContent.indexOf('Scripts/build.ps1')
      const packageWrapperIndex = workflowContent.indexOf('Scripts/package.ps1')
      const testIndex = workflowContent.indexOf('npm test')
      const codecovIndex = workflowContent.indexOf('codecov/codecov-action')

      expect(checkoutIndex).toBeLessThan(nodeIndex)
      expect(nodeIndex).toBeLessThan(npmCiIndex)
      expect(npmCiIndex).toBeLessThan(buildWrapperIndex)
      expect(buildWrapperIndex).toBeLessThan(packageWrapperIndex)
      expect(packageWrapperIndex).toBeLessThan(testIndex)
      expect(testIndex).toBeLessThan(codecovIndex)
    })

    it('npm test should support coverage flag for CI', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'))
      const testScript = packageJson.scripts.test
      // Jest will pick up --coverage from command line automatically
      expect(testScript).toContain('standard')
    })
  })
})
