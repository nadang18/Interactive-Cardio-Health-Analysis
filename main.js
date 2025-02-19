let data = [];

async function loadData() {
    data = await d3.csv('merged_subject_info.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
        
    }));
    createScatterplot();
    processMergedCSV();
}

async function processMergedCSV() {
    const data = await d3.csv('data/merged_subject_info.csv', (row) => ({
        patientId: row['Patient ID'],
        followUpDays: Number(row['Follow-up period from enrollment (days)']),
        exitStudy: row['Exit of the study'],
        causeOfDeath: row['Cause of death'],
        age: Number(row['Age']),
        gender: row['Gender (male=1)'] === '1' ? 'Male' : 'Female',
        weight: Number(row['Weight (kg)']),
        height: Number(row['Height (cm)']),
        bmi: Number(row['Body Mass Index (Kg/m2)']),
        nyhaClass: Number(row['NYHA class']),
        diastolicBP: Number(row['Diastolic blood  pressure (mmHg)']),
        systolicBP: Number(row['Systolic blood pressure (mmHg)']),
        hfEtiology: row['HF etiology - Diagnosis'],
        diabetes: row['Diabetes (yes=1)'] === '1',
        dyslipemia: row['History of dyslipemia (yes=1)'] === '1',
        peripheralVascularDisease: row['Peripheral vascular disease (yes=1)'] === '1',
        hypertension: row['History of hypertension (yes=1)'] === '1',
        myocardialInfarction: row['Prior Myocardial Infarction (yes=1)'] === '1',
        implantableDevice: row['Prior implantable device'] === '1',
        revascularization: row['Prior Revascularization'] === '1',
        syncope: row['Syncope'] === '1',
        dailySmoking: Number(row['daily smoking (cigarretes/day)']),
        smokeFreeTime: Number(row['smoke-free time (years)']),
        cigarettesPerYear: Number(row['cigarettes /year']),
        alcoholConsumption: Number(row['alcohol consumption (standard units)']),
        albumin: Number(row['Albumin (g/L)']),
        alt: Number(row['ALT or GPT (IU/L)']),
        ast: Number(row['AST or GOT (IU/L)']),
        normalizedTroponin: Number(row['Normalized Troponin']),
        totalCholesterol: Number(row['Total Cholesterol (mmol/L)']),
        creatinine: Number(row['Creatinine (?mol/L)']),
        gammaGT: Number(row['Gamma-glutamil transpeptidase (IU/L)']),
        glucose: Number(row['Glucose (mmol/L)']),
        hemoglobin: Number(row['Hemoglobin (g/L)']),
        hdl: Number(row['HDL (mmol/L)']),
        potassium: Number(row['Potassium (mEq/L)']),
        ldl: Number(row['LDL (mmol/L)']),
        sodium: Number(row['Sodium (mEq/L)']),
        proBNP: Number(row['Pro-BNP (ng/L)']),
        protein: Number(row['Protein (g/L)']),
        t3: Number(row['T3 (pg/dL)']),
        t4: Number(row['T4 (ng/L)']),
        troponin: Number(row['Troponin (ng/mL)']),
        tsh: Number(row['TSH (mIU/L)']),
        urea: Number(row['Urea (mg/dL)']),
        pulmonaryVenousHypertension: row['Signs of pulmonary venous hypertension (yes=1)'] === '1',
        cardiothoracicRatio: Number(row['Cardiothoracic ratio']),
        leftAtrialSize: Number(row['Left atrial size (mm)']),
        rightVentricleContractility: row['Right ventricle contractility (altered=1)'] === '1',
        rightVentricleEndDiastolicDiameter: Number(row['Right ventricle end-diastolic diameter (mm)']),
        lvef: Number(row['LVEF (%)']),
        mitralValveInsufficiency: row['Mitral valve insufficiency'] === '1',
        mitralFlowPattern: row['Mitral flow pattern'],
        leftVentricularPosteriorWallThickness: Number(row['Left ventricular posterior wall thickness (mm)']),
        septalThickness: Number(row['Septal thickness (mm)']),
        leftVentricleEndDiastolicDiameter: Number(row['Left ventricle end-diastolic diameter (mm)']),
        leftVentricleEndSystolicDiameter: Number(row['Left ventricle end-systolic diameter (mm)']),
        highResolutionECGAvailable: row['Hig-resolution ECG available'] === '1',
        ecgRhythm: row['ECG rhythm'],
        qWaves: row['Q-waves (necrosis, yes=1)'] === '1',
        prInterval: Number(row['PR interval (ms)']),
        qrsDuration: Number(row['QRS duration (ms)']),
        qrsGreaterThan120ms: row['QRS > 120 ms'] === '1',
        qtInterval: Number(row['QT interval (ms)']),
        qtCorrected: Number(row['QT corrected']),
        averageRR: Number(row['Average RR (ms)']),
        leftVentricularHypertrophy: row['Left ventricular hypertrophy (yes=1)'] === '1',
        intraventricularConductionDisorder: row['Intraventricular conduction disorder'] === '1',
        holterAvailable: row['Holter available'] === '1',
        holterOnset: row['Holter onset (hh:mm:ss)'],
        holterRhythm: row['Holter  rhythm'],
        minimumRR: Number(row['minimum RR (ms)']),
        averageRRHolter: Number(row['Average RR (ms)']),
        maximumRR: Number(row['maximum RR (ms)']),
        rrRange: Number(row['RR range (ms)']),
        numberOfVentricularPrematureBeats: Number(row['Number of ventricular premature beats in 24h']),
        extrasystoleCouplets: Number(row['Extrasystole couplets']),
        ventricularExtrasystole: Number(row['Ventricular Extrasystole']),
        ventricularTachycardia: Number(row['Ventricular Tachycardia']),
        numberOfVentricularPrematureContractionsPerHour: Number(row['Number of ventricular premature contractions per hour']),
        nonSustainedVentricularTachycardia: row['Non-sustained ventricular tachycardia (CH>10)'] === '1',
        numberOfSupraventricularPrematureBeats: Number(row['Number of supraventricular premature beats in 24h']),
        paroxysmalSupraventricularTachyarrhythmia: row['Paroxysmal supraventricular tachyarrhythmia'] === '1',
        longestRRPause: Number(row['Longest RR pause (ms)']),
        bradycardia: row['Bradycardia'] === '1',
        sdnn: Number(row['SDNN (ms)']),
        sdann: Number(row['SDANN (ms)']),
        rmssd: Number(row['RMSSD (ms)']),
        pnn50: Number(row['pNN50 (%)']),
        calciumChannelBlocker: row['Calcium channel blocker (yes=1)'] === '1',
        diabetesMedication: row['Diabetes medication (yes=1)'] === '1',
        amiodarone: row['Amiodarone (yes=1)'] === '1',
        angiotensinIIReceptorBlocker: row['Angiotensin-II receptor blocker (yes=1)'] === '1',
        anticoagulants: row['Anticoagulants/antitrombotics  (yes=1)'] === '1',
        betablockers: row['Betablockers (yes=1)'] === '1',
        digoxin: row['Digoxin (yes=1)'] === '1',
        loopDiuretics: row['Loop diuretics (yes=1)'] === '1',
        spironolactone: row['Spironolactone (yes=1)'] === '1',
        statins: row['Statins (yes=1)'] === '1',
        hidralazina: row['Hidralazina (yes=1)'] === '1',
        aceInhibitor: row['ACE inhibitor (yes=1)'] === '1',
        nitrovasodilator: row['Nitrovasodilator (yes=1)'] === '1'
    }));

    console.log(data);
    return data;
}


function createScatterplot() {
    const width = 1000, height = 600;
    const margin = { top: 50, right: 50, bottom: 60, left: 80 };
  
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
  
    d3.select("#chart").html(""); // Clear previous chart before appending new
  
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)  // Explicit width
        .attr("height", height) // Explicit height
        .style("overflow", "visible");
  
    // Define scales
   xScale = d3.scaleTime()
        .domain(d3.extent(commits, d => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();
  
  yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);
  
    const xAxis = d3.axisBottom(xScale).ticks(10);
    const yAxis = d3.axisLeft(yScale).tickFormat(d => `${d.toFixed(0)}:00`);
  
    svg.append("g")
        .attr("transform", `translate(0, ${usableArea.bottom})`)
        .call(xAxis);
  
    svg.append("g")
        .attr("transform", `translate(${usableArea.left}, 0)`)
        .call(yAxis);
  
    const gridlines = svg.append("g")
        .attr("class", "gridlines")
        .attr("transform", `translate(${usableArea.left}, 0)`)
        .call(d3.axisLeft(yScale).tickFormat("").tickSize(-usableArea.width));
  
    dots = svg.append("g").attr("class", "dots");
  
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  
    rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
  
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  
    dots.selectAll("circle")
        .data(sortedCommits)
        .join("circle")
        .attr("cx", d => xScale(d.datetime))
        .attr("cy", d => yScale(d.hourFrac))
        .attr("r", d => rScale(d.totalLines)) 
        .attr("fill", "steelblue")
        .style("fill-opacity", 0.7)
        .on("mouseenter", function (event, commit) {
            d3.select(event.currentTarget).style("fill-opacity", 1); 

        })
        .on("mouseleave", function () {
            d3.select(event.currentTarget).style("fill-opacity", 0.7);
       
        });
        
        function brushSelector() {
          const brush = d3.brush()
              .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
              .on("start brush end", brushed);
  
          svg.append("g")
              .attr("class", "brush")
              .call(brush)
              .lower(); 
      }
      brushSelector(); 
  }