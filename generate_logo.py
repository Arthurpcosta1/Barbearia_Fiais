import math

gold = '#cfa264'
navy = '#072137'

# Let's create helper to make Tuscon letters
def make_tuscan_b(cx, y_top, y_bot, w):
    h = y_bot - y_top
    ym = y_top + h * 0.5
    y1 = y_top + h * 0.28
    y2 = y_top + h * 0.72
    sw = w * 0.24 # stem width
    x0 = cx - w*0.5
    x_stem_r = x0 + sw
    x_right = cx + w*0.5
    
    # Outer contour of B:
    # Stem: left edge from y_top to y_bot with spur at ym
    # Serifs at top-left and bottom-left
    # Top lobe and bottom lobe
    return f"""
    <path d="M {x0 - w*0.1},{y_top} L {x0 + sw + w*0.05},{y_top} L {x0 + sw},{y_top + h*0.08} 
             L {x0 + sw},{ym - h*0.04} L {x0 + sw*0.6},{ym} L {x0 + sw},{ym + h*0.04}
             L {x0 + sw},{y_bot - h*0.08} L {x0 + sw + w*0.05},{y_bot} L {x0 - w*0.1},{y_bot}
             L {x0},{y_bot - h*0.08} L {x0},{ym + h*0.05} L {x0 - w*0.12},{ym} L {x0},{ym - h*0.05}
             L {x0},{y_top + h*0.08} Z
             M {x0 + sw*0.7},{y_top} Q {x_right + w*0.1},{y_top} {x_right},{y1} Q {x_right - w*0.05},{ym} {x0 + sw*0.6},{ym} Z
             M {x0 + sw*0.7},{ym} Q {x_right + w*0.15},{ym} {x_right + w*0.05},{y2} Q {x_right},{y_bot} {x0 + sw*0.7},{y_bot} Z"
          fill="{gold}"/>
    <!-- Inner holes of B -->
    <path d="M {x0 + sw*1.1},{y_top + h*0.08} Q {x_right - w*0.15},{y_top + h*0.08} {x_right - w*0.15},{y1} Q {x_right - w*0.15},{ym - h*0.04} {x0 + sw*1.1},{ym - h*0.04} Z
             M {x0 + sw*1.1},{ym + h*0.04} Q {x_right - w*0.1},{ym + h*0.04} {x_right - w*0.1},{y2} Q {x_right - w*0.1},{y_bot - h*0.08} {x0 + sw*1.1},{y_bot - h*0.08} Z"
          fill="{navy}"/>
    """

print("Helper defined")
