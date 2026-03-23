const STORAGE_KEY = 'produtos_3d';

const form = document.getElementById('product-form');
const body = document.getElementById('products-body');
const exportBtn = document.getElementById('exportar-csv');
const exportPdfBtn = document.getElementById('exportar-pdf');
const clearBtn = document.getElementById('limpar-tudo');

function toCurrency(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function calculateCost(precoKg, pesoG) {
  return (precoKg / 1000) * pesoG;
}

function calculateSuggestedPrice(cost) {
  return cost * 5;
}

function loadProducts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function formatDuration(hours, minutes) {
  return `${hours}h ${minutes}min`;
}

function renderTable() {
  const products = loadProducts();
  body.innerHTML = '';

  products.forEach((product, index) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${product.image ? `<img class="thumb" src="${product.image}" alt="${product.name}" />` : 'Sem imagem'}</td>
      <td>${product.name}</td>
      <td>${toCurrency(product.precoKg)}</td>
      <td>${product.pesoG.toFixed(2)}</td>
      <td>${formatDuration(product.hours, product.minutes)}</td>
      <td>${toCurrency(product.cost)}</td>
      <td>${toCurrency(product.suggestedPrice)}</td>
      <td><button class="small-btn" data-index="${index}">Remover</button></td>
    `;

    body.appendChild(tr);
  });
}

function readImageAsBase64(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('nome').value.trim();
  const precoKg = Number(document.getElementById('precoKg').value);
  const pesoG = Number(document.getElementById('peso').value);
  const hours = Number(document.getElementById('horas').value);
  const minutes = Number(document.getElementById('minutos').value);
  const imageFile = document.getElementById('imagem').files[0];

  if (!name || precoKg < 0 || pesoG < 0 || hours < 0 || minutes < 0 || minutes > 59) {
    alert('Preencha os campos com valores válidos.');
    return;
  }

  const image = await readImageAsBase64(imageFile);
  const cost = calculateCost(precoKg, pesoG);
  const suggestedPrice = calculateSuggestedPrice(cost);

  const product = {
    name,
    precoKg,
    pesoG,
    hours,
    minutes,
    image,
    cost,
    suggestedPrice,
    createdAt: new Date().toISOString()
  };

  const products = loadProducts();
  products.push(product);
  saveProducts(products);

  form.reset();
  renderTable();
});

body.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const index = Number(target.dataset.index);
  if (Number.isNaN(index)) return;

  const products = loadProducts();
  products.splice(index, 1);
  saveProducts(products);
  renderTable();
});

clearBtn.addEventListener('click', () => {
  if (!confirm('Deseja remover todos os produtos da tabela?')) return;
  localStorage.removeItem(STORAGE_KEY);
  renderTable();
});

function toCsvCell(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

exportBtn.addEventListener('click', () => {
  const products = loadProducts();
  const headers = [
    'nome',
    'preco_kg',
    'peso_g',
    'duracao_horas',
    'duracao_minutos',
    'custo',
    'preco_sugerido',
    'imagem_base64',
    'criado_em'
  ];

  const rows = products.map((p) => [
    p.name,
    p.precoKg,
    p.pesoG,
    p.hours,
    p.minutes,
    p.cost,
    p.suggestedPrice,
    p.image,
    p.createdAt
  ]);

  const csvContent = [headers, ...rows]
    .map((line) => line.map(toCsvCell).join(';'))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'produtos-3d.csv';
  link.click();
  URL.revokeObjectURL(url);
});

function imageFormatFromDataUrl(dataUrl) {
  if (!dataUrl) return 'JPEG';
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'JPEG';
}

function drawPdfHeader(doc, startY, widths, startX) {
  const headers = ['Imagem', 'Nome', 'Custo', 'Preço sugerido'];
  let x = startX;
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFillColor(230, 230, 230);

  headers.forEach((header, idx) => {
    doc.rect(x, startY, widths[idx], 8, 'FD');
    doc.text(header, x + 2, startY + 5.5);
    x += widths[idx];
  });
}

exportPdfBtn.addEventListener('click', () => {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('Biblioteca de PDF não carregou. Verifique a conexão com a internet e tente novamente.');
    return;
  }

  const products = loadProducts();
  if (products.length === 0) {
    alert('Não há produtos para exportar.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const margin = 10;
  const rowHeight = 20;
  const headerHeight = 8;
  const tableTop = 24;
  const widths = [28, 130, 55, 64];
  const startX = margin;
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(14);
  doc.text('Tabela de produtos 3D', margin, 14);
  drawPdfHeader(doc, tableTop, widths, startX);

  let y = tableTop + headerHeight;

  products.forEach((product, index) => {
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text(`Tabela de produtos 3D (continuação)`, margin, 14);
      drawPdfHeader(doc, tableTop, widths, startX);
      y = tableTop + headerHeight;
    }

    let x = startX;

    widths.forEach((width) => {
      doc.rect(x, y, width, rowHeight);
      x += width;
    });

    if (product.image) {
      try {
        const format = imageFormatFromDataUrl(product.image);
        doc.addImage(product.image, format, startX + 2, y + 2, 16, 16);
      } catch {
        doc.setFontSize(8);
        doc.text('Erro na imagem', startX + 2, y + 10);
      }
    } else {
      doc.setFontSize(8);
      doc.text('Sem imagem', startX + 2, y + 10);
    }

    doc.setFontSize(9);
    const name = product.name.length > 55 ? `${product.name.slice(0, 55)}...` : product.name;
    doc.text(name, startX + widths[0] + 2, y + 10);
    doc.text(toCurrency(product.cost), startX + widths[0] + widths[1] + 2, y + 10);
    doc.text(toCurrency(product.suggestedPrice), startX + widths[0] + widths[1] + widths[2] + 2, y + 10);

    y += rowHeight;

    if (index === products.length - 1) {
      doc.setFontSize(8);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, pageHeight - 5);
    }
  });

  doc.save('produtos-3d.pdf');
});

renderTable();
