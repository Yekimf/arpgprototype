"""Prepare the CC0 MakeHuman hm08 anatomy for the game's equipment rig.

Only the explicitly CC0 body mesh is used; helper cubes supply joint positions.
No MakeHuman program code is incorporated. Run with Python 3 (Pillow required for face-color baking).
"""
import json
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'src/art/source/hm08-base.obj'
vertices, texcoords, faces, helpers = [], [], [], defaultdict(set)
group = ''
for line in source.read_text().splitlines():
    p = line.split()
    if not p:
        continue
    if p[0] == 'v':
        vertices.append(tuple(map(float, p[1:4])))
    elif p[0] == 'vt':
        texcoords.append(tuple(map(float, p[1:3])))
    elif p[0] == 'g':
        group = p[1]
    elif p[0] == 'f':
        points = [(int(t.split('/')[0])-1, int(t.split('/')[1])-1) for t in p[1:]]
        if group == 'body':
            for i in range(1, len(points)-1):
                faces.append([points[0], points[i], points[i+1]])
        else:
            helpers[group].update(i for i, _ in points)

def add(a, b): return tuple(x+y for x, y in zip(a, b))
def sub(a, b): return tuple(x-y for x, y in zip(a, b))
def mul(a, s): return tuple(x*s for x in a)
def dot(a, b): return sum(x*y for x, y in zip(a, b))
def length(a): return math.sqrt(dot(a, a))
def unit(a): return mul(a, 1/max(1e-8, length(a)))
def cross(a, b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def world(p): return (p[0]*.11, (p[1]+8.168)*.11, (p[2]-.145)*.11)
def joint(name):
    points = [vertices[i] for i in helpers['joint-'+name]]
    return world(tuple(sum(p[a] for p in points)/len(points) for a in range(3)))
def distance(p, a, b):
    direction = sub(b, a)
    t = min(1, max(0, dot(sub(p, a), direction)/max(1e-8, dot(direction, direction))))
    return length(sub(p, add(a, mul(direction, t))))

bones = [dict(name='torso', a=joint('pelvis'), b=joint('head')),
         dict(name='head', a=joint('head'), b=world((0, 8.45, .16)))]
palms = {}
for side in ['r', 'l']:
    shoulder, elbow, wrist = [joint(side+'-'+n) for n in ['shoulder', 'elbow', 'hand']]
    axis = unit(sub(joint(side+'-finger-3-4'), wrist))
    center = add(wrist, mul(axis, .055))
    width = unit(sub((1, 0, 0), mul(axis, axis[0])))
    normal = unit(cross(width, axis))
    palms[side] = (center, axis, width, normal)
    bones.extend([dict(name=side+'UpperArm', a=shoulder, b=elbow),
                  dict(name=side+'Forearm', a=elbow, b=wrist),
                  dict(name=side+'Hand', a=center, b=add(center, mul(axis, .1)))])
for side in ['r', 'l']:
    hip, knee, ankle, toe = [joint(side+'-'+n) for n in ['upper-leg', 'knee', 'ankle', 'foot-2']]
    bones.extend([dict(name=side+'Thigh', a=hip, b=knee), dict(name=side+'Shin', a=knee, b=ankle), dict(name=side+'Foot', a=ankle, b=toe)])

def weights(original):
    x, y, z = original
    p = world(original)
    if y > 5.8 and abs(x) < 1.5:
        head = min(1, max(0, (y-5.8)/.65))
        return [1, 0, 0, 0], [head, 1-head, 0, 0]
    if abs(x) > 1.35 and 1 < y < 6.2:
        candidates = [2, 3, 4] if x < 0 else [5, 6, 7]
        if abs(x) < 2.0:
            candidates.append(0)
    elif y < .9 and abs(x) > .35:
        candidates = [8, 9, 10] if x < 0 else [11, 12, 13]
        if y > -.1:
            candidates.append(0)
    else:
        return [0, 0, 0, 0], [1, 0, 0, 0]
    near = sorted([(distance(p, bones[i]['a'], bones[i]['b']), i) for i in candidates])[:2]
    values = [1/(d+.015)**4 for d, _ in near]
    total = sum(values)
    return [near[0][1], near[1][1], 0, 0], [values[0]/total, values[1]/total, 0, 0]

positions, uv, indices, skin_indices, skin_weights, lookup = [], [], [[], [], []], [], [], {}
for face in faces:
    center = tuple(sum(vertices[i][a] for i, _ in face)/3 for a in range(3))
    material = 1 if center[1] > 5.9 else 2 if abs(center[0]) > 4.03 and center[1] > 1 else 0
    for i, t in face:
        key = (i, t)
        if key not in lookup:
            lookup[key] = len(positions)//3
            original, p = vertices[i], world(vertices[i])
            # Curl the anatomical fingers into a grip instead of stamping a mitten.
            if abs(original[0]) > 4.03 and original[1] > 1:
                center_p, axis, width, normal = palms['r' if original[0] < 0 else 'l']
                relative = sub(p, center_p)
                along, across, depth = dot(relative, axis), dot(relative, width), dot(relative, normal)
                if along > .04:
                    angle = min(2.7, (along-.04)/.035)
                    p = add(center_p, add(mul(width, across), add(mul(axis, .04+.035*math.sin(angle)-depth*math.sin(angle)), mul(normal, .035*(1-math.cos(angle))+depth*math.cos(angle)))))
            positions.extend(round(n, 6) for n in p)
            uv.extend(round(n, 6) for n in texcoords[t])
            bone_ids, influence = weights(original)
            skin_indices.extend(bone_ids)
            skin_weights.extend(round(n, 6) for n in influence)
        indices[material].append(lookup[key])

data = dict(source='MakeHuman hm08 body — CC0 1.0', bones=bones,
            eyes=[joint('r-eye'), joint('l-eye')], positions=positions, uv=uv,
            indices=indices, skinIndices=skin_indices, skinWeights=skin_weights)
# The neutral basemesh is an average of age/gender targets. Use the authored
# adult head forms, normalized back to our neck socket, rather than inflating
# an average face into a spherical/cartoon head.
def target(name):
    result = {}
    for line in (ROOT / 'src/art/source' / name).read_text().splitlines():
        p = line.split()
        if p and not p[0].startswith('#'):
            result[int(p[0])] = tuple(map(float, p[1:4]))
    return result

data['headMorphs'], data['headEyes'] = {}, {}
for sex in ['male', 'female']:
    young = target(sex+'-young.target')
    old = target('male-old.target') if sex == 'male' else young
    delta = {i: add(mul(young.get(i, (0, 0, 0)), .78 if sex == 'male' else 1), mul(old.get(i, (0, 0, 0)), .22 if sex == 'male' else 0)) for i in range(len(vertices))}
    shift = tuple(sum(delta[i][j] for i in helpers['joint-head'])/len(helpers['joint-head']) for j in range(3))
    data['headMorphs'][sex] = []
    for (i, t), index in lookup.items():
        blend = min(1, max(0, (vertices[i][1]-5.4)/.9))
        if blend:
            data['headMorphs'][sex].append([index, *[round(n*.11*blend, 6) for n in sub(delta[i], shift)]])
    data['headEyes'][sex] = []
    for side in ['r', 'l']:
        helper = helpers['joint-'+side+'-eye']
        eye_delta = tuple(sum(delta[i][j] for i in helper)/len(helper) for j in range(3))
        data['headEyes'][sex].append(add(joint(side+'-eye'), mul(sub(eye_delta, shift), .11)))
# Bake the generated, frontal albedo atlas onto head vertices. The rest of the
# body keeps its tiled fabric/skin materials, without a runtime image dependency.
from PIL import Image
atlas = Image.open(ROOT / 'src/art/source/guard-face-albedo.png').convert('RGB')
data['faceColors'] = {}
for sex in ['male', 'female']:
    morph = {row[0]: row[1:] for row in data['headMorphs'][sex]}
    eye_y = sum(p[1] for p in data['headEyes'][sex])/2
    colors = []
    for i in range(len(positions)//3):
        if i not in morph:
            continue
        p = add(tuple(positions[i*3:i*3+3]), morph[i])
        if p[1] < 1.60:
            continue
        u = max(.07, min(.93, .5+p[0]/.20))
        if p[1] >= eye_y:
            t = .40-(p[1]-eye_y)/max(.04, 1.83-eye_y)*.39
        else:
            t = .40+(eye_y-p[1])/.10*.51
        x = int((u*.5+(0 if sex=='male' else .5))*(atlas.width-1))
        y = int(max(.01, min(.95, t))*(atlas.height-1))
        rgb = atlas.getpixel((x,y))
        weight = min(1, max(0, (p[2]-.025)/.045))
        rgb = [int(a*weight+b*(1-weight)) for a,b in zip(rgb,(171,145,123))]
        colors.append([i, *[round(((c/255+.055)/1.055)**2.4 if c>10 else c/255/12.92, 5) for c in rgb]])
    data['faceColors'][sex] = colors
output = ROOT / 'src/art/runtime/guard-anatomy.json'
output.write_text(json.dumps(data, separators=(',', ':'))+'\n')
print(f'{output}: {len(positions)//3} vertices, {sum(map(len, indices))//3} triangles')
