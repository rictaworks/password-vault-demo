import * as fs from 'fs'
import * as path from 'path'

const SRC_DIR = path.join(__dirname, '../../src')
const EXCLUDED_DIRS = ['i18n', 'config']
const ALLOWED_LITERAL_PATTERN = /^[a-zA-Z0-9_.\-\/]+$/

function collectTsFiles(dir: string, excludeDirs: string[]): string[] {
  const result: string[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludeDirs.includes(entry.name)) continue
      result.push(...collectTsFiles(path.join(dir, entry.name), excludeDirs))
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      result.push(path.join(dir, entry.name))
    }
  }
  return result
}

describe('ハードコード禁止チェック', () => {
  const files = collectTsFiles(SRC_DIR, EXCLUDED_DIRS)

  it('収集対象のtsファイルが存在する', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('services/repositories/utilsに日本語文字列がハードコードされていない', () => {
    const violatingFiles: string[] = []
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8')
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.includes('//')) continue
        // 日本語文字（U+3000-U+9FFF）が文字列リテラルとして直接含まれているか
        if (/["'`][^"'`]*[　-鿿][^"'`]*["'`]/.test(line)) {
          // カテゴリ値のみ許可（DBのチェック制約で使用）
          if (!line.includes('CHECK(') && !line.includes('IN (') && !line.includes("'ウェブ'") && !line.includes("'アプリ'") && !line.includes("'金融'") && !line.includes("'SNS'") && !line.includes("'その他'")) {
            violatingFiles.push(`${file}:${i + 1}`)
          }
        }
      }
    }
    expect(violatingFiles).toEqual([])
  })
})
