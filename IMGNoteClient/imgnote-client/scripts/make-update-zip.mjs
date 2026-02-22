import fs from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

async function fileExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function findNewestExe(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const exes = []
  for (const e of entries) {
    if (!e.isFile()) continue
    if (!e.name.toLowerCase().endsWith('.exe')) continue
    const p = path.join(dir, e.name)
    const st = await fs.stat(p)
    exes.push({ path: p, name: e.name, mtimeMs: st.mtimeMs })
  }
  exes.sort((a, b) => b.mtimeMs - a.mtimeMs)
  return exes[0] || null
}

async function main() {
  const cwd = process.cwd()
  const pkgPath = path.join(cwd, 'package.json')
  if (!(await fileExists(pkgPath))) {
    throw new Error('请在项目根目录运行：找不到 package.json')
  }
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'))
  const version = pkg.version || '0.0.0'

  const outDir = path.join(cwd, 'installPackages')
  if (!(await fileExists(outDir))) {
    throw new Error('找不到 installPackages，请先执行打包（build:win）')
  }

  const newest = await findNewestExe(outDir)
  if (!newest) throw new Error('installPackages 下未找到 exe 安装包')

  const rl = readline.createInterface({ input, output })
  const defaultTitle = `IMGNote v${version}`
  const title = (await rl.question(`版本标题（默认：${defaultTitle}）：`)).trim() || defaultTitle
  const notes = (await rl.question('更新内容简要说明（可留空）：')).trim()
  await rl.close()

  const buf = await fs.readFile(newest.path)
  const totalSize = buf.length
  console.log(`源安装包: ${newest.name} (${(totalSize / (1024 * 1024)).toFixed(1)} MB)`)

  const manifest = {
    version,
    title,
    notes,
    publishedAt: new Date().toISOString(),
    file: newest.name,
    size: totalSize
  }

  const manifestPath = path.join(outDir, `IMGNote-update.${version}.json`)
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
  const latestPath = path.join(outDir, 'IMGNote-latest.json')
  await fs.writeFile(latestPath, JSON.stringify(manifest, null, 2), 'utf8')
  console.log(`已生成版本清单：${manifestPath}`)
  console.log(`已生成最新版本指针：${latestPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
