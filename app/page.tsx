"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Palette, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Color conversion utilities (equivalent to Python's colorsys)
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  const s = max === 0 ? 0 : diff / max
  const v = max

  if (diff !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / diff + 2) / 6
        break
      case b:
        h = ((r - g) / diff + 4) / 6
        break
    }
  }

  return [h * 360, s * 100, v * 100]
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h /= 360
  s /= 100
  v /= 100

  const c = v * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = v - c

  let r = 0,
    g = 0,
    b = 0

  if (h >= 0 && h < 1 / 6) {
    r = c
    g = x
    b = 0
  } else if (h >= 1 / 6 && h < 2 / 6) {
    r = x
    g = c
    b = 0
  } else if (h >= 2 / 6 && h < 3 / 6) {
    r = 0
    g = c
    b = x
  } else if (h >= 3 / 6 && h < 4 / 6) {
    r = 0
    g = x
    b = c
  } else if (h >= 4 / 6 && h < 5 / 6) {
    r = x
    g = 0
    b = c
  } else if (h >= 5 / 6 && h < 1) {
    r = c
    g = 0
    b = x
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [Number.parseInt(result[1], 16), Number.parseInt(result[2], 16), Number.parseInt(result[3], 16)]
    : [0, 0, 0]
}

// Color palette generation class (ported from colors.py)
class ColorPaletteGenerator {
  private leftX = 8
  private rightX = 98
  private leftY = 95
  private rightY = 20
  private xArray = new Array(9).fill(0)
  private yArray = new Array(9).fill(0)
  private power1 = 2
  private power2 = 2

  constructor() {
    this.xArray[0] = this.leftX
    this.xArray[8] = this.rightX
    this.yArray[0] = this.leftY
    this.yArray[8] = this.rightY
  }

  setPower1(power: number) {
    this.power1 = power / 100
  }

  setPower2(power: number) {
    this.power2 = power / 100
  }

  private calculateIncrements(x: number, y: number, power: number): number {
    const z = x - y
    let b = 0
    for (let i = 1; i <= z; i++) {
      b += Math.pow(power, i - 1)
    }
    return b
  }

  private generateX(anchor: number) {
    // Calculate equal increments from left to right
    const leftXIncrements = (this.xArray[anchor] - this.xArray[0]) / anchor
    for (let i = 1; i < anchor; i++) {
      this.xArray[i] = Math.round(this.xArray[i - 1] + leftXIncrements)
    }
    const rightXIncrements = (this.xArray[8] - this.xArray[anchor]) / (8 - anchor)
    for (let i = anchor + 1; i < 8; i++) {
      this.xArray[i] = Math.round(this.xArray[i - 1] + rightXIncrements)
    }
  }

  private generateY(anchor: number) {
    // Calculate exponential increments from left to right
    const leftYIncrements = (this.yArray[0] - this.yArray[anchor]) / this.calculateIncrements(anchor, 0, this.power2)
    for (let i = 1; i < anchor; i++) {
      this.yArray[i] = Math.round(this.yArray[i - 1] - leftYIncrements * Math.pow(this.power2, i - 1))
    }
    const rightYIncrements = (this.yArray[anchor] - this.yArray[8]) / this.calculateIncrements(8, anchor, this.power2)
    for (let i = anchor + 1; i < 8; i++) {
      this.yArray[i] = Math.round(this.yArray[i - 1] - rightYIncrements * Math.pow(this.power2, 3 - (i - 5)))
    }
  }

  private generateHex(h: number): string[] {
    const hexCodes: string[] = []
    for (let i = 0; i < 9; i++) {
      const [r, g, b] = hsvToRgb(h, this.xArray[i], this.yArray[i])
      const hex = rgbToHex(r, g, b)
      hexCodes.push(hex)
    }
    return hexCodes
  }

  makeGradient(rgb: [number, number, number], anchor: number): string[] {
    const [h, s, v] = rgbToHsv(rgb[0], rgb[1], rgb[2])

    this.xArray[anchor] = Math.round(s)
    this.yArray[anchor] = Math.round(v)

    this.generateX(anchor)
    this.generateY(anchor)

    return this.generateHex(h)
  }
}

export default function ColorPalettePicker() {
  const [generator] = useState(() => new ColorPaletteGenerator())
  const [currentBrandColor, setCurrentBrandColor] = useState<[number, number, number]>([74, 144, 226])
  const [anchor, setAnchor] = useState(4)
  const [power2, setPower2] = useState(200)
  const [palette, setPalette] = useState<string[]>([])
  const [selectedColorInput, setSelectedColorInput] = useState("#4a90e2")
  const { toast } = useToast()

  const generatePalette = useCallback(() => {
    generator.setPower2(power2)
    const hexes = generator.makeGradient(currentBrandColor, anchor)
    setPalette(hexes)
  }, [generator, currentBrandColor, anchor, power2])

  // Generate initial palette
  useState(() => {
    generatePalette()
  })

  const handleColorChange = (color: string, index: number) => {
    const rgb = hexToRgb(color)
    setCurrentBrandColor(rgb)
    setAnchor(index)
    setSelectedColorInput(color)
  }

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setSelectedColorInput(color)
    const rgb = hexToRgb(color)
    setCurrentBrandColor(rgb)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${text} copied to clipboard`,
    })
  }

  const copyAllColors = () => {
    const allColors = palette.join(", ")
    navigator.clipboard.writeText(allColors)
    toast({
      title: "All colors copied!",
      description: "All hex codes copied to clipboard",
    })
  }

  const exportPalette = () => {
    const cssVariables = palette.map((color, index) => `  --color-${index + 1}: ${color};`).join("\n")
    const css = `:root {\n${cssVariables}\n}`

    const blob = new Blob([css], { type: "text/css" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "color-palette.css"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Palette className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Color Palette Generator</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create beautiful color palettes using advanced HSV algorithms. Click any color to set it as your brand
            color, then adjust the curve power to generate harmonious variations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="color-input">Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color-input"
                    type="color"
                    value={selectedColorInput}
                    onChange={handleColorInputChange}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={selectedColorInput}
                    onChange={handleColorInputChange}
                    placeholder="#4a90e2"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="power-slider">Curve Power: {power2}</Label>
                <Slider
                  id="power-slider"
                  min={0}
                  max={300}
                  step={1}
                  value={[power2]}
                  onValueChange={(value) => setPower2(value[0])}
                  className="w-full"
                />
                <p className="text-sm text-gray-500">Controls the distribution curve for lightness variations</p>
              </div>

              <div className="space-y-2">
                <Label>Anchor Position: {anchor + 1}</Label>
                <p className="text-sm text-gray-500">Click any color in the palette to set it as the anchor point</p>
              </div>

              <Button onClick={generatePalette} className="w-full">
                Generate Palette
              </Button>

              <div className="flex gap-2">
                <Button onClick={copyAllColors} variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
                <Button onClick={exportPalette} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Palette Display */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Generated Palette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-4">
                {palette.map((color, index) => (
                  <div key={index} className="space-y-2">
                    <button
                      onClick={() => handleColorChange(color, index)}
                      className={`w-full aspect-square rounded-lg border-4 transition-all hover:scale-105 ${
                        index === anchor ? "border-gray-900 shadow-lg" : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Click to set as anchor (Position ${index + 1})`}
                    />
                    <div className="text-center">
                      <button
                        onClick={() => copyToClipboard(color)}
                        className="text-xs font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                        title="Click to copy"
                      >
                        {color}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {anchor !== null && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Anchor:</strong> Position {anchor + 1} ({palette[anchor]}) - This color serves as the
                    reference point for generating the palette variations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">1. Choose Your Brand Color</h3>
              <p className="text-gray-600">
                Use the color picker or enter a hex code to select your primary brand color.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">2. Set Anchor Position</h3>
              <p className="text-gray-600">
                Click any position in the palette to place your brand color there. The algorithm will generate
                variations around it.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">3. Adjust the Curve</h3>
              <p className="text-gray-600">
                Use the power slider to control how dramatically the lightness varies across the palette.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
