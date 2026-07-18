window.parseEffect = // Parse effect text into structured stats and unparsed details
  function(text) {
    const stats = {};
    const unparsed = [];
    if (!text) return { stats, unparsed };
    
    const clean = text.replace(/\r/g, '').trim();
    const parts = clean.split(/[,;\n]/);
    
    const BARE_STATS_REG = /^(HP|SP|ATK|MATK|FLEE|Flee|HIT|STR|AGI|VIT|INT|DEX|LUK|DEF|MDEF|Perfect Dodge|Crit|Critical)$/i;
    let pendingStats = [];
    
    for (let part of parts) {
      part = part.trim().replace(/\.$/, '').trim(); // Clean trailing periods and spaces
      if (!part) continue;
      
      let m;
      if (BARE_STATS_REG.test(part)) {
        pendingStats.push(part.toUpperCase());
        continue;
      }
      
      // All Stats +1 / Gives +1 to all status
      m = part.match(/Gives\s*\+(\d+)\s+to\s+all\s+status/i) ||
          part.match(/All\s+stats?\s*\+\s*(\d+)/i);
      if (m) {
        const val = parseInt(m[1]);
        const statsList = ['STR', 'AGI', 'VIT', 'INT', 'DEX', 'LUK'];
        statsList.forEach(s => {
          stats[s] = (stats[s] || 0) + val;
        });
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }
      
      // HP & SP / HP/SP combined
      m = part.match(/(HP\s*(?:&|\/)\s*SP)\s*\+\s*(\d+)(%?)/i);
      if (m) {
        const val = parseInt(m[2]);
        const suffix = m[3] || '';
        stats['HP' + suffix] = (stats['HP' + suffix] || 0) + val;
        stats['SP' + suffix] = (stats['SP' + suffix] || 0) + val;
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // ATK & MATK / ATK/MATK combined
      m = part.match(/(ATK\s*(?:&|\/)\s*MATK)\s*\+\s*(\d+)(%?)/i);
      if (m) {
        const val = parseInt(m[2]);
        const suffix = m[3] || '';
        stats['ATK' + suffix] = (stats['ATK' + suffix] || 0) + val;
        stats['MATK' + suffix] = (stats['MATK' + suffix] || 0) + val;
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Attack +X% Magic Attack +Y%
      m = part.match(/Attack\s*\+\s*(\d+)%\s+Magic\s+Attack\s*\+\s*(\d+)%/i);
      if (m) {
        stats['ATK%'] = (stats['ATK%'] || 0) + parseInt(m[1]);
        stats['MATK%'] = (stats['MATK%'] || 0) + parseInt(m[2]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Single Attack / Magic Attack
      m = part.match(/^(?:Magic )?Attack\s*\+\s*(\d+)%/i);
      if (m) {
        const isMagic = /Magic Attack/i.test(part);
        stats[isMagic ? 'MATK%' : 'ATK%'] = (stats[isMagic ? 'MATK%' : 'ATK%'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Stat1 & Stat2 + X (e.g. STR & AGI + 1)
      m = part.match(/([A-Z]{3})\s*(?:&|\/)\s*([A-Z]{3})\s*\+\s*(\d+)/i);
      if (m && ['STR','AGI','VIT','INT','DEX','LUK'].includes(m[1].toUpperCase()) && ['STR','AGI','VIT','INT','DEX','LUK'].includes(m[2].toUpperCase())) {
        const val = parseInt(m[3]);
        stats[m[1].toUpperCase()] = (stats[m[1].toUpperCase()] || 0) + val;
        stats[m[2].toUpperCase()] = (stats[m[2].toUpperCase()] || 0) + val;
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Magic Critical Rate / Magic Crit
      m = part.match(/Magic (?:Critical|CRIT)(?:\s+Rate)?\s*\+\s*(\d+)%/i);
      if (m) {
        stats['Magic CRIT %'] = (stats['Magic CRIT %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Attack Speed / Attack Rate -> ASPD %
      m = part.match(/(?:Attack Speed|Attack Rate)\s*\+\s*(\d+)%/i);
      if (m) {
        stats['ASPD %'] = (stats['ASPD %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // 5% HP -> HP%
      m = part.match(/^(\d+)%\s+HP$/i) || part.match(/^Maximum\s+HP\s*\+\s*(\d+)%/i);
      if (m) {
        stats['HP%'] = (stats['HP%'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Specific edge case: Maximum HP +1% Reduce near attacks by 1%
      m = part.match(/Maximum HP\s*\+\s*(\d+)%\s+Reduce near attacks(?: by)? (\d+)%/i);
      if (m) {
        stats['HP%'] = (stats['HP%'] || 0) + parseInt(m[1]);
        stats['Melee Resist %'] = (stats['Melee Resist %'] || 0) + parseInt(m[2]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Bypass Dispell Immunity
      m = part.match(/Bypass Dispell Immunity\s*\+\s*(\d+)%/i) ||
          part.match(/Adds\s+a\s+(\d+)%\s+chance\s+to\s+bypass\s+Dispell\s+immunity/i);
      if (m) {
        stats['Bypass Dispell Immunity %'] = (stats['Bypass Dispell Immunity %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Bypass Defender Skill
      m = part.match(/Adds\s+(\d+)%(?:\s+chance)?\s+to\s+bypass\s+Defender\s+skill(?:\s+effect)?/i);
      if (m) {
        stats['Bypass Defender Skill %'] = (stats['Bypass Defender Skill %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Physical and Range Reflect combined
      m = part.match(/Physical and Range Reflect\s*\+\s*(\d+)%/i);
      if (m) {
        const val = parseInt(m[1]);
        stats['Melee Reflect %'] = (stats['Melee Reflect %'] || 0) + val;
        stats['Ranged Reflect %'] = (stats['Ranged Reflect %'] || 0) + val;
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Physical Reflect -> Melee Reflect %
      m = part.match(/Physical Reflect\s*\+\s*(\d+)%/i) ||
          part.match(/Reflect\s+(\d+)%\s+of\s+all\s+melee\s+physical\s+damage/i);
      if (m) {
        stats['Melee Reflect %'] = (stats['Melee Reflect %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Long Range Reflect -> Ranged Reflect %
      m = part.match(/Long Range Reflect\s*\+\s*(\d+)%/i) ||
          part.match(/Reflect\s+(\d+)%\s+range(?:d)?\s+damage/i);
      if (m) {
        // The first regex captures in m[1], the second in m[1] as well
        stats['Ranged Reflect %'] = (stats['Ranged Reflect %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Magic Spell Reflect / Magical Reflect
      m = part.match(/(?:Magic\s+spells?\s+reflect|Magical\s+Reflect|Magic\s+reflect\s+chance|Reflect\s+magic\s+damage)\s*(?:\+|by\s+)?\s*(\d+)%/i);
      if (m) {
        stats['Magic Reflect %'] = (stats['Magic Reflect %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Damage to Target Monsters -> Target Damage % / Race Damage % / Size Damage % / Element Damage %
      m = part.match(/(?:Increase )?Damage to ([A-Za-z]+)(?: Monsters?)?(?:\s+by|\s*\+)\s*\+?(\d+)%/i) ||
          part.match(/([A-Za-z]+)\s+monster(?:s)?\s+damage\s*(?:\+)?\s*(\d+)%/i);
      if (m) {
        let type = m[1].toLowerCase();
        let statName = type.charAt(0).toUpperCase() + type.slice(1);
        if (['small', 'medium', 'large'].includes(type)) statName += ' Monster Damage %';
        else if (['boss'].includes(type)) statName += ' Damage %';
        else if (['fire', 'water', 'wind', 'earth', 'holy', 'dark', 'ghost', 'undead', 'poison', 'neutral'].includes(type)) statName += ' Element Damage %';
        else statName += ' Race Damage %';
        
        stats[statName] = (stats[statName] || 0) + parseInt(m[2]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }
      
      // Drop Rate
      m = part.match(/Drop Rate(?: of any items and cards increased)?(?: by |\s*\+\s*)(\d+)%/i);
      if (m) {
        stats['Drop Rate %'] = (stats['Drop Rate %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }
      
      // Movespeed Rate
      m = part.match(/Movespeed Rate\s*\+\s*(\d+)%/i);
      if (m) {
        stats['Movespeed Rate %'] = (stats['Movespeed Rate %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Critical Rate +1% -> CRIT
      m = part.match(/(?:Critical|CRIT)\s+Rate\s*\+\s*(\d+)%/i);
      if (m) {
        stats['CRIT'] = (stats['CRIT'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Heal Effectiveness
      m = part.match(/Heal Effectiveness\s*\+\s*(\d+)%/i) ||
          part.match(/Increases?\s+effect\s+of\s+Healing\s+skills\s+by\s+(\d+)%/i);
      if (m) {
        stats['Heal Effectiveness %'] = (stats['Heal Effectiveness %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Drop Rate % (Drop Rate + 1%, Increase Drop Rate by 1%, Item drop rate increase by 5%)
      m = part.match(/(?:Increase\s+)?Drop\s*Rate\s*\+\s*(\d+)%/i) || 
          part.match(/Increase\s+Drop\s*Rate\s+by\s+(\d+)%/i) ||
          part.match(/Item\s+drop\s+rate\s+increase\s+by\s+(\d+)%/i);
      if (m) {
        stats['Drop Rate %'] = (stats['Drop Rate %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Nullify Magic Attack
      m = part.match(/Nullify Magic Attack(?: by)?\s*(\d+)%/i);
      if (m) {
        stats['Nullify Magic Attack %'] = (stats['Nullify Magic Attack %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Ranged Defense / Long Range defense
      m = part.match(/Long Range defense\s*\+\s*(\d+)%/i) ||
          part.match(/Reduce damage from (?:long\s+)?range[d]?\s+attacks\s+by\s+(\d+)%/i);
      if (m) {
        stats['Ranged Resist %'] = (stats['Ranged Resist %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Ranged Damage
      m = part.match(/Range(?:d)?\s+attack\s*\+\s*(\d+)%/i) ||
          part.match(/Ranged\s+Damage\s*\+\s*(\d+)%/i);
      if (m) {
        stats['Ranged Damage %'] = (stats['Ranged Damage %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Property defense +X% (e.g. Fire Property defense +7%, Earth Property defense +3%)
      m = part.match(/^(.+?)\s+Property\s+defense\s*\+\s*(\d+)%/i) ||
          part.match(/^(.+?)\s+Property\s+resistance\s*\+\s*(\d+)%/i) ||
          part.match(/Adds\s+resist\s+against\s+(.+?)\s+property\s+by\s+(\d+)%/i) ||
          part.match(/Resistance\s+to\s+(.+?)\s+Property\s*\+\s*(\d+)%/i) ||
          part.match(/(Ghost|Fire|Water|Earth|Wind|Shadow|Holy|Neutral|Poison|Undead)\s+Resist\s*\+\s*(\d+)%/i);
      if (m) {
        let type = m[1].trim();
        type = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        if (type === 'Shadow') type = 'Dark';
        stats[`${type} Element Resist %`] = (stats[`${type} Element Resist %`] || 0) + parseInt(m[2]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Size monster defense
      m = part.match(/Reduce damage from (Small|Medium|Large)\s+monsters\s+by\s+(\d+)%/i);
      if (m) {
        const size = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
        stats[`${size} Monster Resist %`] = (stats[`${size} Monster Resist %`] || 0) + parseInt(m[2]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // All size resist
      m = part.match(/All\s+size\s+Resist\s*\+\s*(\d+)%/i) ||
          part.match(/Receive\s+(\d+)%\s+less\s+damage\s+from\s+all\s+size\s+monsters/i);
      if (m) {
        const val = parseInt(m[1]);
        ['Small', 'Medium', 'Large'].forEach(size => {
          stats[`${size} Monster Resist %`] = (stats[`${size} Monster Resist %`] || 0) + val;
        });
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Weight limit increase (Weight limit increase +1000)
      m = part.match(/Weight limit increase\s*\+\s*(\d+)/i);
      if (m) {
        stats['Max Weight'] = (stats['Max Weight'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Magic Resist (Reduce damage from magic attacks by X%)
      m = part.match(/Reduce damage from magic attacks by (\d+)%/i);
      if (m) {
        stats['Magic Resist %'] = (stats['Magic Resist %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // X Property/Monster/Skill damage +Y%
      m = part.match(/^(.+?)(?:\s+monster)?\s+damage\s*\+\s*(\d+)%/i);
      if (m) {
        let type = m[1].trim();
        type = type.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (type === 'Demon Property') type = 'Demon';
        
        // Element Damage normalization (e.g. Dark Property -> Dark Element, Fire -> Fire Element)
        const elements = ['Dark', 'Earth', 'Fire', 'Wind', 'Ghost', 'Holy', 'Neutral', 'Poison', 'Shadow', 'Undead', 'Water'];
        elements.forEach(el => {
          if (type === `${el} Property` || type === el) {
            type = `${el} Element`;
          }
        });
        
        const races = ['Angel', 'Brute', 'Demihuman', 'Demon', 'Dragon', 'Fish', 'Formless', 'Insect'];
        if (races.includes(type)) {
          type = `${type} Race`;
        }
        
        const sizes = ['Small', 'Medium', 'Large'];
        if (sizes.includes(type)) {
          type = `${type} Monster`;
        }
        
        stats[`${type} Damage %`] = (stats[`${type} Damage %`] || 0) + parseInt(m[2]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // After-Cast Delay reduction
      m = part.match(/Reduces? all skill's after-cast delay by (\d+)%/i) ||
          part.match(/Reduce\s+after\s*cast\s+delay\s+by\s+(\d+)%/i);
      if (m) {
        stats['After-Cast Delay %'] = (stats['After-Cast Delay %'] || 0) - parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Skill Hard Delay reduction
      m = part.match(/Reduces?\s+all\s+skill's\s+hard\s+delay\s+by\s+(\d+)%/i);
      if (m) {
        stats['Skill Hard Delay %'] = (stats['Skill Hard Delay %'] || 0) - parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Melee Resist (Near attacks resist)
      m = part.match(/Near attacks?\s*resist\s*\+\s*(\d+)%/i) ||
          part.match(/Reduce damage from near attacks by (\d+)%/i);
      if (m) {
        stats['Melee Resist %'] = (stats['Melee Resist %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Ranged Resist
      m = part.match(/Reduces? damage(?: taken)? from long range(?: physical)? attacks? by (\d+)%/i);
      if (m) {
        stats['Ranged Resist %'] = (stats['Ranged Resist %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Target Resist (Reduce damage from X by Y%)
      m = part.match(/Reduce(?:s)? damage(?: taken)? from ([A-Za-z]+)(?: monsters?)? by (\d+)%/i);
      if (m) {
        let type = m[1].toLowerCase();
        let statName = type.charAt(0).toUpperCase() + type.slice(1);
        if (['small', 'medium', 'large'].includes(type)) statName += ' Monster Resist %';
        else if (['boss'].includes(type)) statName += ' Resist %';
        else statName += ' Race Resist %';
        
        stats[statName] = (stats[statName] || 0) + parseInt(m[2]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Property/Size/Race Resists (e.g. Dark Resist, Demon Resist, Medium Resist)
      m = part.match(/([A-Za-z]+)\s+Resist\s*\+\s*(\d+)%/i) ||
          part.match(/Increases? resistance against ([A-Za-z]+) elemental attacks? by (\d+)%/i);
      if (m) {
        let type = m[1].toLowerCase();
        if (type === 'deomn') type = 'demon'; // Typo handler
        
        let properType = type.charAt(0).toUpperCase() + type.slice(1);
        
        if (['Fire', 'Water', 'Wind', 'Earth', 'Holy', 'Dark', 'Ghost', 'Undead', 'Poison', 'Neutral', 'All'].includes(properType)) {
          if (properType === 'All') {
            const val = parseInt(m[2]);
            const elements = ['Fire', 'Water', 'Wind', 'Earth', 'Holy', 'Dark', 'Ghost', 'Undead', 'Poison', 'Neutral'];
            elements.forEach(e => {
              stats[`${e} Element Resist %`] = (stats[`${e} Element Resist %`] || 0) + val;
            });
          } else {
            let statName = `${properType} Element Resist %`;
            stats[statName] = (stats[statName] || 0) + parseInt(m[2]);
          }
        } else if (['Small', 'Medium', 'Large'].includes(properType)) {
          stats[`${properType} Monster Resist %`] = (stats[`${properType} Monster Resist %`] || 0) + parseInt(m[2]);
        } else if (['Boss'].includes(properType)) {
          stats[`Boss Resist %`] = (stats[`Boss Resist %`] || 0) + parseInt(m[2]);
        } else {
          stats[`${properType} Race Resist %`] = (stats[`${properType} Race Resist %`] || 0) + parseInt(m[2]);
        }
        
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }
      
      // Resist to all element
      m = part.match(/Resist to all element(?:s)?\s*\+\s*(\d+)%/i);
      if (m) {
        const val = parseInt(m[1]);
        const elements = ['Fire', 'Water', 'Wind', 'Earth', 'Holy', 'Dark', 'Ghost', 'Undead', 'Poison', 'Neutral'];
        elements.forEach(e => {
          stats[`${e} Element Resist %`] = (stats[`${e} Element Resist %`] || 0) + val;
        });
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Resist to all element except neutral
      m = part.match(/Resist to all element(?:s)? except neutral\s*\+\s*(\d+)%/i);
      if (m) {
        const val = parseInt(m[1]);
        const elements = ['Fire', 'Water', 'Wind', 'Earth', 'Holy', 'Dark', 'Ghost', 'Undead', 'Poison'];
        elements.forEach(e => {
          stats[`${e} Element Resist %`] = (stats[`${e} Element Resist %`] || 0) + val;
        });
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Receive X% less damage from Y monsters
      m = part.match(/Receive\s+(\d+)%\s+less\s+damage\s+from\s+(.+?)(?:\s+monsters)?$/i);
      if (m) {
        const val = parseInt(m[1]);
        let source = m[2].trim();
        source = source.charAt(0).toUpperCase() + source.slice(1);
        if (source.toLowerCase() === 'boss') source = 'Boss';
        if (source.toLowerCase() === 'normal') source = 'Normal Monster';
        stats[`${source} Resist %`] = (stats[`${source} Resist %`] || 0) + val;
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // CRIT Resist (Decreases Chance of being hit by critical by +X%)
      m = part.match(/Decreases\s+Chance\s+of\s+being\s+hit\s+by\s+critical\s+by\s*\+?(\d+)%/i);
      if (m) {
        stats['CRIT Resist %'] = (stats['CRIT Resist %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Increase physical/magic damage on Y monsters by Z%
      m = part.match(/Increase\s+(physical|magic)\s+damage\s+on\s+(.+?)\s+monsters\s+by\s+(\d+)%/i);
      if (m) {
        const type = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
        const target = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
        const val = parseInt(m[3]);
        stats[`${type} Vs ${target} %`] = (stats[`${type} Vs ${target} %`] || 0) + val;
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Y% physical/magic damage against Z
      m = part.match(/(\d+)%\s+(physical|magic)\s+damage\s+against\s+(.+?)(?:s)?$/i);
      if (m) {
        const val = parseInt(m[1]);
        const type = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
        let target = m[3].trim();
        target = target.charAt(0).toUpperCase() + target.slice(1).toLowerCase();
        if (target.endsWith('s') && target.toLowerCase() !== 'boss') {
          target = target.slice(0, -1);
        }
        stats[`${type} Vs ${target} %`] = (stats[`${type} Vs ${target} %`] || 0) + val;
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }
      
      // Strip Chance
      m = part.match(/Increase\s+chance\s+of\s+all\s+Strip\s+skills?\s+by\s+(\d+)%/i) ||
          part.match(/Increase\s+Strip\s+chance\s+by\s+(\d+)%/i);
      if (m) {
        stats['Increase Strip Chance %'] = (stats['Increase Strip Chance %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Dispell Chance
      m = part.match(/Increase\s+Dispell\s+chance\s+by\s+(\d+)%/i);
      if (m) {
        stats['Increase Dispell Chance %'] = (stats['Increase Dispell Chance %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // SP Consumption reduction
      m = part.match(/SP\s+Consumption\s+when\s+using\s+skills\s*-(\d+)%/i) ||
          part.match(/Reduce\s+SP\s+Consumption\s+of\s+skills\s+by\s+(\d+)%/i) ||
          part.match(/Reduces?\s+SP\s+cost\s+by\s+(\d+)%/i);
      if (m) {
        stats['Reduce SP Consumption %'] = (stats['Reduce SP Consumption %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Ignore MDEF of Demihuman
      m = part.match(/Ignore\s+Magical\s+Defense\s+of\s+Demihumans\s*\+\s*(\d+)%/i);
      if (m) {
        stats['Ignore MDEF of Demihuman %'] = (stats['Ignore MDEF of Demihuman %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Nullify Magic Spells
      m = part.match(/Nullify\s+(\d+)%\s+magic\s+spells/i);
      if (m) {
        stats['Nullify Magic Spells %'] = (stats['Nullify Magic Spells %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Reduce damage from Demihuman
      m = part.match(/Reduce\s+damage\s+from\s+Demi-?Humans?\s+by\s+(\d+)%/i);
      if (m) {
        stats['Reduce damage from Demihuman %'] = (stats['Reduce damage from Demihuman %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Reduce Defense
      m = part.match(/Reduce\s+Defense\s+by\s+(\d+)%/i) ||
          part.match(/Decreases?\s+all\s+defenses?\s+applied\s+to\s+its\s+owner\s+by\s+(\d+)%/i);
      if (m) {
        stats['Reduce Defense %'] = (stats['Reduce Defense %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }

      // Resistance against All elements
      m = part.match(/Resistance\s+again[s]?t\s+All\s+elements\s*\+\s*(\d+)%/i);
      if (m) {
        const val = parseInt(m[1]);
        const elements = ['Neutral', 'Water', 'Earth', 'Fire', 'Wind', 'Poison', 'Holy', 'Dark', 'Ghost', 'Undead'];
        elements.forEach(el => {
          stats[`${el} Element Resist %`] = (stats[`${el} Element Resist %`] || 0) + val;
        });
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }
      
      // Critical wounds on attack
      m = part.match(/(\d+)%\s+Chance\s+to\s+inflict\s+Critical\s+wounds\s+when\s+attacking/i);
      if (m) {
        stats['Chance to inflict Critical wounds when attacking %'] = (stats['Chance to inflict Critical wounds when attacking %'] || 0) + parseInt(m[1]);
        pendingStats.forEach(s => unparsed.push(s));
        pendingStats = [];
        continue;
      }
      
      // Single stat
      m = part.match(/^(HP|SP|ATK|MATK|FLEE|Flee|HIT|STR|AGI|VIT|INT|DEX|LUK|DEF|MDEF|Perfect Dodge|Crit|Critical|(?:Max\s*)?Weight|Max\s*HP|Max\s*SP|Maximum HP|Maximum SP)\s*\+\s*(\d+)(%?)$/i);
      if (m) {
        let stat = m[1].toUpperCase().replace(/\s+/g, '');
        if (stat === 'MAXIMUMHP' || stat === 'MAXHP') stat = 'HP';
        if (stat === 'MAXIMUMSP' || stat === 'MAXSP') stat = 'SP';
        if (stat === 'PERFECTDODGE') stat = 'Perfect Dodge';
        if (stat === 'MAXWEIGHT' || stat === 'WEIGHT') stat = 'Max Weight';
        
        const val = parseInt(m[2]);
        const suffix = m[3] || '';
        
        if (stat === 'CRIT' || stat === 'CRITICAL') {
          stats['CRIT'] = (stats['CRIT'] || 0) + val;
          pendingStats.forEach(p => {
            stats[p + suffix] = (stats[p + suffix] || 0) + val;
          });
          pendingStats = [];
          continue;
        }
        
        stats[stat + suffix] = (stats[stat + suffix] || 0) + val;
        pendingStats.forEach(p => {
          stats[p + suffix] = (stats[p + suffix] || 0) + val;
        });
        pendingStats = [];
        continue;
      }
      
      unparsed.push(part);
      pendingStats.forEach(s => unparsed.push(s));
      pendingStats = [];
    }
    pendingStats.forEach(s => unparsed.push(s));
    return { stats, unparsed };
  };
