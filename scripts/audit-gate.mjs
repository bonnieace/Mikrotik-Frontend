import { spawnSync } from 'node:child_process'

const accepted = new Map([
  [
    'GHSA-vfj7-8cjw-p6xm',
    'braces <=3.0.3: no patched release exists upstream; accept temporarily while upstream/dependency chains migrate away.',
  ],
  [
    'GHSA-86w9-cpqp-85rv',
    'node-forge <=1.4.0: no patched release exists upstream; npm --force would require a breaking Nuxt downgrade rather than a patched node-forge.',
  ],
])

const audit = spawnSync('npm', ['audit', '--json'], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
})

if (audit.error) {
  console.error('Unable to run npm audit:', audit.error.message)
  process.exit(1)
}

let report
try {
  report = JSON.parse(audit.stdout || '{}')
} catch {
  console.error('npm audit did not return valid JSON.')
  console.error(audit.stdout || audit.stderr)
  process.exit(1)
}

const vulnerabilities = report.vulnerabilities || {}
const severityRank = { low: 1, moderate: 2, high: 3, critical: 4 }
const acceptedHits = new Map()
const blocking = new Map()

function advisoryId(via) {
  const url = String(via?.url || '')
  const match = url.match(/GHSA-[A-Za-z0-9-]+/i)
  return match ? match[0].toUpperCase() : null
}

function inspectPackage(name, seen = new Set()) {
  if (seen.has(name)) return
  seen.add(name)

  const entry = vulnerabilities[name]
  if (!entry || severityRank[entry.severity] < severityRank.high) return

  for (const via of entry.via || []) {
    if (typeof via === 'string') {
      inspectPackage(via, seen)
      continue
    }

    if (!via || severityRank[via.severity] < severityRank.high) continue

    const id = advisoryId(via)
    const key = id || via.url || `${via.name || name}: ${via.title || 'unknown advisory'}`
    const item = {
      id: id || 'NO-GHSA-ID',
      package: via.name || name,
      severity: via.severity,
      title: via.title || 'Unknown advisory',
      url: via.url || '',
    }

    if (id && accepted.has(id)) {
      acceptedHits.set(key, item)
    } else {
      blocking.set(key, item)
    }
  }
}

for (const [name, entry] of Object.entries(vulnerabilities)) {
  if (severityRank[entry.severity] >= severityRank.high) inspectPackage(name)
}

if (acceptedHits.size) {
  console.log('Temporarily accepted upstream-unpatched advisories:')
  for (const item of acceptedHits.values()) {
    console.log(`- ${item.id} [${item.severity}] ${item.package}: ${item.title}`)
    console.log(`  reason: ${accepted.get(item.id)}`)
  }
}

if (blocking.size) {
  console.error('\nBlocking high/critical advisories:')
  for (const item of blocking.values()) {
    console.error(`- ${item.id} [${item.severity}] ${item.package}: ${item.title} ${item.url}`)
  }
  process.exit(1)
}

const counts = report.metadata?.vulnerabilities || {}
console.log(
  `Audit policy passed. npm audit totals: ${counts.critical || 0} critical, ${counts.high || 0} high, ${counts.moderate || 0} moderate, ${counts.low || 0} low.`,
)
