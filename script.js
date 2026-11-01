// Constantes baseadas no script Python
const X_LADO_B = 414; 
const MANUAL = "TO-12S10-2AVS9-2";
const MALETA = "ANV-126A-001";
const PAGE_WIDTH = 595.28; 
const PAGE_HEIGHT = 841.89;

// Implementa a lógica imprimeMonoculo
function imprimeMonoculo(doc, coordenadasStr, eixoX, diagramStartY) {
    
    // --- CONSTANTES DE DESENHO ---
    const ESCALA = 2.5; 
    const RADII = [25, 75, 105]; 

    const Y_ALTURA_TOTAL_ORIGINAL = 300; 
    const Y_ALTURA_ESCALADA = Y_ALTURA_TOTAL_ORIGINAL / ESCALA; 
    
    // O centro Y do diagrama no PDF, para desenhar os círculos
    const CENTRO_Y_FINAL = diagramStartY + (145 / ESCALA); 
    
    // Coordenadas X ORIGINAIS no sistema de origem
    const CENTRO_ESQUERDO_X_ORIG = 175;
    const CENTRO_DIREITO_X_ORIG = 425; 
    
    // Mantemos a margem do texto em 40pt para o diagrama
    const EIXO_X_NOVO_INICIO = 40; 
    
    // 2. CÁLCULO DAS POSIÇÕES FINAIS NO PDF
    const CENTRO_ESQUERDO_X_FINAL = EIXO_X_NOVO_INICIO + CENTRO_ESQUERDO_X_ORIG / ESCALA;
    const CENTRO_DIREITO_X_FINAL = EIXO_X_NOVO_INICIO + CENTRO_DIREITO_X_ORIG / ESCALA;
    
    // Desenha os Círculos (Monóculos) - ESSA PARTE É INCONDICIONAL
    doc.setDrawColor(0); 
    doc.setLineWidth(0.5); 

    const drawMonocle = (centerX, centerY) => {
        RADII.forEach(r => {
            doc.circle(centerX, centerY, r / ESCALA, 'D'); 
        });
    };

    drawMonocle(CENTRO_ESQUERDO_X_FINAL, CENTRO_Y_FINAL); 
    drawMonocle(CENTRO_DIREITO_X_FINAL, CENTRO_Y_FINAL); 
    // --- FIM DO DESENHO DOS CÍRCULOS ---
    
    let parsed_coordenadas = [];
    
    let cleanStr = coordenadasStr.trim().replace(/^'|'$/g, ''); 
    
    const emptyTableData = {'B': { 'setor1': '', 'setor2': '', 'setor3': '' }, 'C': { 'setor1': '', 'setor2': '', 'setor3': '' } };

    if (cleanStr === '') {
        return { tableData: emptyTableData, finalY: diagramStartY + Y_ALTURA_ESCALADA + 10 }; 
    }

    // Simplificação do parsing
    cleanStr = cleanStr.replace(/\[\[|\]\]|'|"/g, ''); 
    const regex = /\[(\d+),(\d+)\]\[([A-C]*)\]\[(\d+)\]\[(setor\d|fora)\]/g;
    let match;
    let tempArray = [];
    
    while ((match = regex.exec(cleanStr)) !== null) {
        tempArray.push(match);
    }

    tempArray.forEach(match => {
        parsed_coordenadas.push({
            x: parseInt(match[1]), 
            y: parseInt(match[2]), 
            tamanho: match[3] || 'B', 
            label: match[4], 
            setor: match[5]
        });
    });

    const coordenadas = parsed_coordenadas;
    
    if (coordenadas.length === 0) {
        return { tableData: emptyTableData, finalY: diagramStartY + Y_ALTURA_ESCALADA + 10 };
    }
    
    let tableData = {...emptyTableData};

    // Processa e desenha cada blackspot
    coordenadas.forEach(item => {
        if (item.setor === 'fora') return; 

        let x_orig = item.x, y_orig = item.y, tamanho = item.tamanho, label = item.label, setor = item.setor; 
        
        let x = x_orig;
        
        // Posição X final no PDF 
        const posX = EIXO_X_NOVO_INICIO + x / ESCALA;
        
        // Posição Y final no PDF 
        const posY = diagramStartY + (y_orig / ESCALA); 
        
        // Fonte da legenda do black spot mantida em 6pt para visualização clara.
        // Se você realmente quiser 10pt, altere o 6 para 10.
        doc.setFontSize(6); 
        doc.text(label, posX + 2, posY); 
        doc.circle(posX, posY, 0.5, 'FD'); 
        // Fonte retorna para o padrão após plotagem.
        doc.setFontSize(10); 

        if (tableData[tamanho] && tableData[tamanho][setor] !== undefined) {
            tableData[tamanho][setor] += (tableData[tamanho][setor] ? ', ' : '') + label;
        }
    });

    // Retorna os dados da tabela e a posição Y final do diagrama
    return { tableData: tableData, finalY: diagramStartY + Y_ALTURA_ESCALADA + 10 }; 
}

// Traduz o código do técnico para o nome completo
function getNomeTecnico(trigrama) {
    const tecnico = trigrama;
    if (tecnico === "WSO") return "3° Sgt Sousa";
    if (tecnico === "LUE") return "2° Sgt Luender";
    return tecnico; 
}

// Mapeia a lógica de impressão para uma página
function imprimePagina(doc, registros, eixoX) {
    // Desestruturação dos registros
    const [
        maletaSn, os, inicio, termino, pn, sn, corrente, leftGain, rightGain, 
        razao, dioptEsq, dioptDir, colimado, snpp, blackspot, tecnico
    ] = registros;

    const nomeTecnico = getNomeTecnico(tecnico);
    let currentY = 40; 
    const MARGEM_ESQUERDA_TEXTO = 40; 
    
    // *** PADRONIZAÇÃO DA FONTE PRINCIPAL PARA 10PT ***
    doc.setFontSize(10); 
    doc.setFont('Helvetica', 'normal'); 

    // Título Principal
    doc.setFont('Helvetica', 'bold'); 
    const textWidth = doc.getStringUnitWidth("B MNT SUP AV EX - OF MNT OVN - FICHA DE AVALIACÃO DE ANVIS") * doc.internal.getFontSize();
    const textX = (doc.internal.pageSize.width - textWidth) / 2;
    doc.text("B MNT SUP AV EX - OF MNT OVN - FICHA DE AVALIACÃO DE ANVIS", textX, currentY);
    currentY += 30; // 70
    doc.setFont('Helvetica', 'normal'); 
    
    // Início do cabeçalho da ficha (OS, PN, SN, etc.)
    doc.text("OS: " + os, MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.text("Início: " + inicio, 180 + eixoX, currentY);
    doc.text("Término: " + termino, 290 + eixoX, currentY);
    currentY += 20; // 90
    doc.text("PN: " + pn, MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.text("SN: " + sn, 180 + eixoX, currentY);
    currentY += 20; // 110
    doc.text("Eq. Teste: " + MALETA, MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.text("SN: " + maletaSn, 180 + eixoX, currentY);
    doc.text("Manual aplicado: " + MANUAL, 290 + eixoX, currentY);
    currentY += 20; // 130

    // 1 - INSPECÃO VISUAL:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("1 - INSPECÃO VISUAL:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    currentY += 20; // 150
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text("Verifique se os movimentos mecânicos do NVG estão ok: OK", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    currentY += 20; // 170
    doc.text("Verifique se há corrosão: OK", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    currentY += 20; // 190
    doc.text("Verifique se os contatos estão danificados: OK", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    currentY += 20; // 210
    doc.text("Verifique se existem componentes faltando: OK", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    currentY += 20; // 230
    doc.text("Verifique a tensão das molas: OK", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    currentY += 20; // 250
    doc.text("Verifique se a caixa de força esta quebrada ou rachada: OK", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    currentY += 20; // 270

    // 2 - CORRENTE ELÉTRICA:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("2 - CORRENTE ELÉTRICA:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text(corrente+" mA", 170 + eixoX, currentY); // Valor
    currentY += 20; // 290

    // 3 - SPOT DEFECTS:
    const textSpotDefectsY = currentY;
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("3 - SPOT DEFECTS:", MARGEM_ESQUERDA_TEXTO + eixoX, textSpotDefectsY);
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text("APROVADO (X) | NÃO APROVADO ( )", 138 + eixoX, textSpotDefectsY);
    
    const diagramStartY = currentY + 10; 

    // Chama a função de monóculos
    const { tableData: blackspotTableData, finalY: diagramFinalY } = imprimeMonoculo(doc, blackspot, eixoX, diagramStartY);
    
    const startYTable = diagramFinalY; 
    
    // --- DESENHA A TABELA BLACK SPOTS ---
    if (blackspotTableData) {
        doc.autoTable({
            head: [['Tamanho', 'Setor 1', 'Setor 2', 'Setor 3']],
            body: [
                ['.003 - .006', blackspotTableData.B.setor1, blackspotTableData.B.setor2, blackspotTableData.B.setor3],
                ['.006 - .009', blackspotTableData.C.setor1, blackspotTableData.C.setor2, blackspotTableData.C.setor3],
            ],
            startY: startYTable, 
            theme: 'grid', 
            margin: { left: MARGEM_ESQUERDA_TEXTO, right: MARGEM_ESQUERDA_TEXTO },
            styles: { fontSize: 10, cellPadding: 2, halign: 'center' },
            headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold', fontSize: 10 }
        });
    }
    
    currentY = doc.autoTable.previous.finalY + 20; 

    // 4 - INTENSIDADE:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("4 - INTENSIDADE:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text("APROVADO (X) | NÃO APROVADO ( )", 128 + eixoX, currentY);
    currentY += 20;

    // 5 - TESTE DE GANHO:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("5 - TESTE DE GANHO:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    currentY += 20;
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text(`Ganho Esquerdo: ${leftGain}`, MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.text(`Ganho Direito: ${rightGain}`, 180 + eixoX, currentY);
    doc.text(`Razão: ${razao}`, 320 + eixoX, currentY);
    currentY += 20;

    // 6 - HIGH LIGHT:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("6 - HIGH LIGHT:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text("APROVADO (X) | NÃO APROVADO ( )", 117 + eixoX, currentY);
    currentY += 20;

    // 7 - LOW LIGHT:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("7 - LOW LIGHT:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text("APROVADO (X) | NÃO APROVADO ( )", 115 + eixoX, currentY);
    currentY += 20;

    // 8 - INFINITY FOCUS:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("8 - INFINITY FOCUS:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text("APROVADO (X) | NÃO APROVADO ( )", 138 + eixoX, currentY);
    currentY += 20;

    // 9 - DIOPTRIA:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("9 - DIOPTRIA:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text("APROVADO (X) | NÃO APROVADO ( )", 106 + eixoX, currentY);
    currentY += 20;

    doc.text(`Dioptria Esquerda: ${dioptEsq}`, MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.text(`Dioptria Direita: ${dioptDir}`, 180 + eixoX, currentY);
    currentY += 20;

    // 10 - COLIMAÇÃO:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("10 - COLIMAÇÃO:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.setFont('Helvetica', 'normal'); // NORMAL
    if (colimado == 0) {
        doc.text("Precisou ser colimado? SIM ( ) | NÃO (X) - APROVADO (X) | NÃO APROVADO ( )", 128 + eixoX, currentY);
        currentY += 20;
    } else {
        doc.text("Precisou ser colimado? SIM (X) | NÃO ( ) - APROVADO (X) | NÃO APROVADO ( )", 128 + eixoX, currentY);
        currentY += 20;
    }

    // 11 - PURGUE:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("11 - PURGUE:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    currentY += 20;
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text("REALIZADO? SIM (X) | NÃO( ) - VAZAMENTO? SIM ( ) | NÃO (X) - TROCA DE O-RING? SIM( ) | NÃO (X)", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    currentY += 20;

    // 12 - POWER PACK:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("12 - POWER PACK:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY);
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text("APROVADO (X) | NÃO APROVADO ( )", 134 + eixoX, currentY);
    doc.text(`SN: ${snpp}`, 320 + eixoX, currentY);
    currentY += 20;

    currentY += 40;

    // PARECER GERAL:
    doc.setFont('Helvetica', 'bold'); // BOLD
    doc.text("PARECER GERAL:", MARGEM_ESQUERDA_TEXTO + eixoX, currentY + 10);
    doc.setFont('Helvetica', 'normal'); // NORMAL
    doc.text("APROVADO(X) | NÃO APROVADO( ) - Técnico: " + nomeTecnico, 135 + eixoX, currentY + 10);
}

// Função principal (chamada pelo botão)
async function printRelatorio() {
    const textarea = document.getElementById('input-texto');
    const texto = textarea.value;
    const registros = texto.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.split(/\s+/)); 

    if (registros.length === 0) {
        alert("Nenhum registro encontrado para gerar o relatório.");
        return;
    }

    const doc = new jspdf.jsPDF({
        unit: 'pt',
        format: 'letter'
    });
    
    for (let i = 0; i < registros.length; i++) {
        const registro = registros[i];
        imprimePagina(doc, registro, 0);
        if (i < registros.length - 1) {
            doc.addPage();
        }
    }

    doc.save('relatorio.pdf');
}

document.getElementById('btn-gerar').addEventListener('click', printRelatorio);
