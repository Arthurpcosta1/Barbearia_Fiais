import math

gold = '#cfa264'
navy = '#072137'

svg_parts = []
svg_parts.append(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="{navy}"/>

  <!-- TOP FLOURISH & MUSTACHE -->
  <g fill="none" stroke="{gold}" stroke-linecap="round" stroke-linejoin="round">
    <!-- Top left flourish line with upward curled tip -->
    <path d="M 72,92 C 78,78 92,76 98,84 C 102,90 96,98 88,98 C 80,98 75,88 80,80 C 102,60 148,106 200,132" stroke-width="4.2"/>
    <!-- Top right flourish line with upward curled tip -->
    <path d="M 440,92 C 434,78 420,76 414,84 C 410,90 416,98 424,98 C 432,98 437,88 432,80 C 410,60 364,106 312,132" stroke-width="4.2"/>
  </g>

  <!-- Handlebar Mustache in top center -->
  <path d="M 256,140 
           C 246,133 234,121 216,121 
           C 192,121 178,132 168,135 
           C 188,143 210,151 230,151 
           C 245,151 252,144 256,140 
           C 260,144 267,151 282,151 
           C 302,151 324,143 344,135 
           C 334,132 320,121 296,121 
           C 278,121 266,133 256,140 Z" 
        fill="{gold}"/>

  <!-- BARBEARIA (Victorian / Tuscan Western Typography) -->
''')

# 9 letters: B, A, R, B, E, A, R, I, A
letters_data = [
    # (type, cx, y_top, y_bot, w)
    ('B', 86,  125, 275, 38),
    ('A', 126, 134, 266, 36),
    ('R', 166, 144, 257, 35),
    ('B', 205, 154, 248, 32),
    ('E', 256, 163, 240, 31), # Exact middle letter
    ('A', 307, 154, 248, 32),
    ('R', 346, 144, 257, 35),
    ('I', 386, 134, 266, 26),
    ('A', 426, 125, 275, 38)
]

for ltype, cx, yt, yb, w in letters_data:
    h = yb - yt
    ym = yt + h * 0.5
    hw = w * 0.5
    
    if ltype == 'B':
        sw = w * 0.28
        x0 = cx - hw
        x1 = x0 + sw
        xr = cx + hw
        y1 = yt + h * 0.28
        y2 = yt + h * 0.72
        path = f"""
        <g fill="{gold}">
          <path d="M {x0-4},{yt} L {x1+3},{yt} L {x1},{yt+7} L {x1},{yb-7} L {x1+3},{yb} L {x0-4},{yb} L {x0},{yb-7} L {x0},{ym+6} L {x0-6},{ym} L {x0},{ym-6} L {x0},{yt+7} Z"/>
          <path d="M {x1},{yt} Q {xr+6},{yt} {xr},{y1} Q {xr-2},{ym} {x1},{ym} L {x1},{ym-7} Q {xr-7},{ym-7} {xr-7},{y1} Q {xr-7},{yt+7} {x1},{yt+7} Z"/>
          <path d="M {x1},{ym} Q {xr+7},{ym} {xr+2},{y2} Q {xr-2},{yb} {x1},{yb} L {x1},{yb-7} Q {xr-6},{yb-7} {xr-6},{y2} Q {xr-6},{ym+7} {x1},{ym+7} Z"/>
          <polygon points="{xr-5},{ym} {xr+1},{ym-4} {xr},{ym} {xr+1},{ym+4}"/>
        </g>"""
        svg_parts.append(path)
        
    elif ltype == 'A':
        sw = w * 0.26
        x0 = cx - hw
        xr = cx + hw
        yc = yt + h * 0.58
        path = f"""
        <g fill="{gold}">
          <path d="M {cx},{yt} L {cx-sw*0.8},{yt+7} L {x0+3},{yb} L {x0-4},{yb} L {x0},{yb-7} L {x0+sw*0.8},{yc+5} L {x0+sw*0.3},{ym} L {x0+sw*0.8},{ym-5} L {cx-sw*0.4},{yt+9} Z"/>
          <path d="M {cx},{yt} L {cx+sw*0.8},{yt+7} L {xr+4},{yb} L {xr-3},{yb} L {xr-sw},{yc} L {cx},{yt} Z"/>
          <rect x="{x0+sw*0.7}" y="{yc-3.5}" width="{w - sw*1.4}" height="6"/>
          <path d="M {cx-9},{yt} L {cx+9},{yt} L {cx+5},{yt+6} L {cx-5},{yt+6} Z"/>
          <path d="M {x0-5},{yb} L {x0+sw+3},{yb} L {x0+sw},{yb-5} L {x0},{yb-5} Z"/>
          <path d="M {xr-sw-3},{yb} L {xr+5},{yb} L {xr},{yb-5} L {xr-sw},{yb-5} Z"/>
        </g>"""
        svg_parts.append(path)
        
    elif ltype == 'R':
        sw = w * 0.28
        x0 = cx - hw
        x1 = x0 + sw
        xr = cx + hw
        y1 = yt + h * 0.28
        path = f"""
        <g fill="{gold}">
          <path d="M {x0-4},{yt} L {x1+3},{yt} L {x1},{yt+7} L {x1},{yb-7} L {x1+3},{yb} L {x0-4},{yb} L {x0},{yb-7} L {x0},{ym+6} L {x0-6},{ym} L {x0},{ym-6} L {x0},{yt+7} Z"/>
          <path d="M {x1},{yt} Q {xr+6},{yt} {xr},{y1} Q {xr-2},{ym} {x1},{ym} L {x1},{ym-7} Q {xr-7},{ym-7} {xr-7},{y1} Q {xr-7},{yt+7} {x1},{yt+7} Z"/>
          <path d="M {x1+2},{ym-4} Q {xr-3},{ym+h*0.22} {xr+3},{yb} L {xr-7},{yb} Q {xr-11},{ym+h*0.22} {x1},{ym+5} Z"/>
          <path d="M {xr-7},{yb} L {xr+7},{yb} L {xr+5},{yb-5} L {xr-5},{yb-5} Z"/>
        </g>"""
        svg_parts.append(path)
        
    elif ltype == 'E':
        sw = w * 0.28
        x0 = cx - hw
        x1 = x0 + sw
        xr = cx + hw
        path = f"""
        <g fill="{gold}">
          <path d="M {x0-4},{yt} L {x1+2},{yt} L {x1},{yt+7} L {x1},{yb-7} L {x1+2},{yb} L {x0-4},{yb} L {x0},{yb-7} L {x0},{ym+5} L {x0-5},{ym} L {x0},{ym-5} L {x0},{yt+7} Z"/>
          <path d="M {x1},{yt} L {xr+2},{yt} L {xr+2},{yt+12} L {xr-5},{yt+6} L {x1},{yt+6} Z"/>
          <path d="M {x1},{ym-3} L {xr-5},{ym-3} L {xr-1},{ym} L {xr-5},{ym+3} L {x1},{ym+3} Z"/>
          <path d="M {x1},{yb-6} L {xr-5},{yb-6} L {xr+2},{yb-12} L {xr+2},{yb} L {x1},{yb} Z"/>
        </g>"""
        svg_parts.append(path)
        
    elif ltype == 'I':
        sw = w * 0.34
        x0 = cx - sw*0.5
        x1 = cx + sw*0.5
        path = f"""
        <g fill="{gold}">
          <path d="M {x0},{yt+7} L {x1},{yt+7} L {x1},{ym-5} L {x1+5},{ym} L {x1},{ym+5} L {x1},{yb-7} L {x0},{yb-7} L {x0},{ym+5} L {x0-5},{ym} L {x0},{ym-5} Z"/>
          <path d="M {cx-hw},{yt} L {cx+hw},{yt} L {cx+hw-3},{yt+6} L {cx-hw+3},{yt+6} Z"/>
          <path d="M {cx-hw+3},{yb-6} L {cx+hw-3},{yb-6} L {cx+hw},{yb} L {cx-hw},{yb} Z"/>
        </g>"""
        svg_parts.append(path)

# FIAIS SECTION
# Positioned right under the arch of BARBEARIA
fiais_data = [
    # (char, cx, cy, rot)
    ('F', 156, 296, -9),
    ('I', 208, 287, -4.5),
    ('A', 256, 284, 0),
    ('I', 304, 287, 4.5),
    ('S', 356, 296, 9)
]

svg_parts.append(f'''
  <!-- FIAIS (Bold Slab-Serif Typography) -->
  <g fill="{gold}" stroke="{navy}" stroke-width="1.8" paint-order="stroke fill">
''')

for char, cx, cy, rot in fiais_data:
    if char == 'F':
        svg_parts.append(f'''
        <g transform="translate({cx},{cy}) rotate({rot})">
          <path d="M -19,-22 L 19,-22 L 19,-12 L 10,-15 L -5,-15 L -5,-4 L 12,-4 L 12,3 L -5,3 L -5,14 L 7,14 L 7,22 L -19,22 L -19,14 L -9,14 L -9,-15 L -19,-15 Z"/>
        </g>''')
    elif char == 'I':
        svg_parts.append(f'''
        <g transform="translate({cx},{cy}) rotate({rot})">
          <path d="M -16,-22 L 16,-22 L 16,-15 L 6,-15 L 6,15 L 16,15 L 16,22 L -16,22 L -16,15 L -6,15 L -6,-15 L -16,-15 Z"/>
        </g>''')
    elif char == 'A':
        svg_parts.append(f'''
        <g transform="translate({cx},{cy}) rotate({rot})">
          <path d="M -8,-22 L 8,-22 L 20,22 L 8,22 L 5,10 L -5,10 L -8,22 L -20,22 Z
                   M 0,-12 L -3,3 L 3,3 Z"/>
          <rect x="-22" y="17" width="13" height="5"/>
          <rect x="9" y="17" width="13" height="5"/>
        </g>''')
    elif char == 'S':
        svg_parts.append(f'''
        <g transform="translate({cx},{cy}) rotate({rot})">
          <path d="M 16,-22 L 16,-10 L 9,-10 L 9,-15 L -5,-15 C -12,-15 -12,-8 -5,-6 L 5,-3 C 15,-1 17,9 10,17 C 5,22 -5,23 -12,22 L -17,22 L -17,10 L -9,10 L -9,15 L 3,15 C 8,15 9,10 4,8 L -5,5 C -15,3 -17,-7 -10,-15 C -5,-21 5,-22 16,-22 Z"/>
        </g>''')

svg_parts.append('''  </g>''')

# BOTTOM EMBLEM: GLASSES & SCISSORS
svg_parts.append(f'''
  <!-- BOTTOM EMBLEM: GLASSES & SCISSORS -->
  <g fill="none" stroke="{gold}" stroke-linecap="round" stroke-linejoin="round">
    <!-- Left eyeglass temple -->
    <path d="M 135,338 C 95,353 60,362 45,364 C 36,366 40,373 52,373 C 68,373 80,371 88,368" stroke-width="4.2"/>
    <ellipse cx="88" cy="368" rx="4.5" ry="3.5" fill="{gold}" stroke="none"/>

    <!-- Right eyeglass temple -->
    <path d="M 377,338 C 417,353 452,362 467,364 C 476,366 472,373 460,373 C 444,373 432,371 424,368" stroke-width="4.2"/>
    <ellipse cx="424" cy="368" rx="4.5" ry="3.5" fill="{gold}" stroke="none"/>

    <!-- Upper eyeglass browline connecting hinges and bridging over scissors -->
    <path d="M 135,338 Q 185,344 220,337 Q 256,332 292,337 Q 327,344 377,338" stroke-width="4.2"/>

    <!-- Lower V-Shield rim meeting at apex -->
    <path d="M 135,338 L 256,422 L 377,338" stroke-width="4.2"/>

    <!-- Crossed Scissors in center -->
    <!-- Left ring -->
    <ellipse cx="237" cy="334" rx="14" ry="13" stroke-width="3.8"/>
    <!-- Right ring -->
    <ellipse cx="275" cy="334" rx="14" ry="13" stroke-width="3.8"/>

    <!-- Scissor Blades crossing through each other in an X -->
    <path d="M 243,346 L 293,386" stroke-width="4.8"/>
    <path d="M 269,346 L 219,386" stroke-width="4.8"/>
  </g>
</svg>''')

full_svg = "".join(svg_parts)
with open('public/images/logo-fiais.svg', 'w') as f:
    f.write(full_svg)

with open('dist/images/logo-fiais.svg', 'w') as f:
    f.write(full_svg)

print("make_svg.py updated!")
