// Animación de florecitas al hacer clic en botones
const FLOWER_EMOJIS = ['🌸', '🌷', '🌹', '✨'];

function burstFlowers(x, y) {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'flower-particle';
    el.textContent = FLOWER_EMOJIS[Math.floor(Math.random() * FLOWER_EMOJIS.length)];

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 55 + Math.random() * 55;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');

    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

document.addEventListener('click', (e) => {
  const interactive = e.target.closest(
    'a, button, .gallery-grid img, input[type="submit"], .menu-checkbox'
  );
  if (interactive) {
    burstFlowers(e.clientX, e.clientY);
  }
});

// Animaciones de aparición al hacer scroll
const revealTargets = document.querySelectorAll(
  '.section, .card, .step, .vm-card, .gallery-grid img, .custom-order, .contact-card, .menu-item, .food-photo'
);
revealTargets.forEach((el) => el.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('visible'));
}

// Formulario de pedido personalizado -> WhatsApp
const orderForm = document.getElementById('custom-order-form');
const orderPhotoInput = document.getElementById('order-photo');
const orderPhotoPreview = document.getElementById('order-photo-preview');
const orderHint = document.getElementById('order-hint');

let selectedOrderPhoto = null;

if (orderPhotoInput) {
  orderPhotoInput.addEventListener('change', () => {
    selectedOrderPhoto = orderPhotoInput.files[0] || null;
    orderPhotoPreview.innerHTML = '';
    if (selectedOrderPhoto) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(selectedOrderPhoto);
      img.alt = 'Vista previa de la foto de referencia';
      orderPhotoPreview.appendChild(img);
    }
  });
}

function buildOrderMessage(data) {
  const lines = [
    'Hola! Quiero cotizar un pedido personalizado en Mañana y tardes encantadas:',
    `Nombre: ${data.nombre}`,
    `Tipo de producto: ${data.tipo}`,
    data.fecha ? `Fecha deseada: ${data.fecha}` : null,
    `Detalles: ${data.descripcion}`,
    selectedOrderPhoto ? 'Voy a adjuntar una foto de referencia en este chat.' : null,
  ].filter(Boolean);
  return lines.join('\n');
}

if (orderForm) {
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      nombre: orderForm.nombre.value.trim(),
      tipo: orderForm.tipo.value,
      fecha: orderForm.fecha.value,
      descripcion: orderForm.descripcion.value.trim(),
    };
    const message = buildOrderMessage(data);
    const waUrl = `https://wa.me/573177128401?text=${encodeURIComponent(message)}`;

    if (
      selectedOrderPhoto &&
      navigator.canShare &&
      navigator.canShare({ files: [selectedOrderPhoto] })
    ) {
      try {
        await navigator.share({
          files: [selectedOrderPhoto],
          text: message,
          title: 'Cotización Mañana y tardes encantadas',
        });
        orderHint.textContent =
          'Se abrió el menú para compartir tu foto y mensaje. Elige WhatsApp y envíalo a nuestro número.';
        return;
      } catch (err) {
        // El usuario canceló el share o no se pudo completar: seguimos con el enlace de WhatsApp.
      }
    }

    if (selectedOrderPhoto) {
      orderHint.textContent =
        'Se abrió WhatsApp con tu mensaje. No olvides adjuntar la foto que seleccionaste directamente en el chat.';
    } else {
      orderHint.textContent = 'Se abrió WhatsApp con tu mensaje listo para enviar.';
    }
    window.open(waUrl, '_blank', 'noopener');
  });
}

// Modal de producto de la galería -> WhatsApp con especificaciones
const productModal = document.getElementById('product-modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalSend = document.getElementById('modal-send');
const modalClose = document.getElementById('modal-close');

let currentProductName = '';

function openProductModal(img) {
  currentProductName = img.alt || 'este producto';
  modalImage.src = img.src;
  modalImage.alt = img.alt;
  modalTitle.textContent = currentProductName;
  modalDesc.value = '';
  productModal.hidden = false;
  document.body.classList.add('modal-open');
  modalDesc.focus();
}

function closeProductModal() {
  productModal.hidden = true;
  document.body.classList.remove('modal-open');
}

document.querySelectorAll('.gallery-grid img').forEach((img) => {
  img.addEventListener('click', () => openProductModal(img));
});

if (modalClose) {
  modalClose.addEventListener('click', closeProductModal);
}

if (productModal) {
  productModal.addEventListener('click', (e) => {
    if (e.target === productModal) {
      closeProductModal();
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && productModal && !productModal.hidden) {
    closeProductModal();
  }
});

const modalHint = document.getElementById('modal-hint');

if (modalSend) {
  modalSend.addEventListener('click', async () => {
    const modifications = modalDesc.value.trim();
    const lines = [
      `Hola! Me interesa este producto: ${currentProductName}`,
      modifications
        ? `Modificaciones que quiero hacerle: ${modifications}`
        : 'Quiero más información sobre este producto.',
      'Por favor confírmenme el precio.',
    ];
    const message = lines.join('\n');
    const waUrl = `https://wa.me/573177128401?text=${encodeURIComponent(message)}`;

    if (navigator.share) {
      try {
        const response = await fetch(modalImage.src);
        const blob = await response.blob();
        const file = new File([blob], 'producto.jpg', { type: blob.type || 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            text: message,
            title: 'Mañana y tardes encantadas',
          });
          closeProductModal();
          return;
        }
      } catch (err) {
        // No se pudo compartir la foto automáticamente: seguimos con el enlace de WhatsApp de solo texto.
      }
    }

    if (modalHint) {
      modalHint.textContent =
        'Se abrió WhatsApp con tu mensaje. No olvides adjuntar esta foto manualmente en el chat.';
    }
    window.open(waUrl, '_blank', 'noopener');
    closeProductModal();
  });
}

// Menú interactivo -> resumen y pedido por WhatsApp
const menuItems = document.querySelectorAll('[data-menu-item]');
const menuSummaryText = document.getElementById('menu-summary-text');
const menuWhatsappBtn = document.getElementById('menu-whatsapp-btn');

function getMenuSelection() {
  const selection = [];
  menuItems.forEach((item) => {
    const checkbox = item.querySelector('.menu-select');
    if (checkbox && checkbox.checked) {
      const qty = parseInt(item.querySelector('.qty-value').textContent, 10);
      const ingredients = Array.from(item.querySelectorAll('.menu-list li')).map((li) =>
        li.textContent.trim()
      );
      selection.push({ name: item.dataset.name, qty, ingredients });
    }
  });
  return selection;
}

function updateMenuSummary() {
  if (!menuSummaryText || !menuWhatsappBtn) return;
  const selection = getMenuSelection();
  if (selection.length === 0) {
    menuSummaryText.textContent = 'Aún no has seleccionado ningún desayuno.';
    menuWhatsappBtn.disabled = true;
    return;
  }
  const totalItems = selection.reduce((sum, s) => sum + s.qty, 0);
  const detail = selection.map((s) => `${s.qty}x ${s.name}`).join(', ');
  menuSummaryText.textContent = `Tienes ${totalItems} desayuno(s) seleccionado(s): ${detail}`;
  menuWhatsappBtn.disabled = false;
}

menuItems.forEach((item) => {
  const checkbox = item.querySelector('.menu-select');
  const qtyBox = item.querySelector('.menu-qty');
  const qtyValue = item.querySelector('.qty-value');
  const increaseBtn = item.querySelector('[data-qty-increase]');
  const decreaseBtn = item.querySelector('[data-qty-decrease]');

  if (!checkbox) return;

  checkbox.addEventListener('change', () => {
    item.classList.toggle('selected', checkbox.checked);
    qtyBox.hidden = !checkbox.checked;
    if (checkbox.checked) {
      qtyValue.textContent = '1';
    }
    updateMenuSummary();
  });

  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      const next = Math.min(10, parseInt(qtyValue.textContent, 10) + 1);
      qtyValue.textContent = String(next);
      updateMenuSummary();
    });
  }

  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      const next = Math.max(1, parseInt(qtyValue.textContent, 10) - 1);
      qtyValue.textContent = String(next);
      updateMenuSummary();
    });
  }
});

const menuNotesInput = document.getElementById('menu-notes');

if (menuWhatsappBtn) {
  menuWhatsappBtn.addEventListener('click', () => {
    const selection = getMenuSelection();
    if (selection.length === 0) return;

    const notes = menuNotesInput ? menuNotesInput.value.trim() : '';

    const lines = ['Hola! Quiero hacer este pedido del menú:', ''];
    selection.forEach((s) => {
      const numberMatch = s.name.match(/\d+/);
      const number = numberMatch ? numberMatch[0] : s.name;
      lines.push(
        `Quiero un desayuno número ${number}, unidades: ${s.qty} (incluye: ${s.ingredients.join(', ')})`
      );
    });
    if (notes) {
      lines.push('', `Modificaciones / notas: ${notes}`);
    }
    lines.push('', '¿Podrían confirmarme disponibilidad y el valor total?');

    const message = lines.join('\n');
    const waUrl = `https://wa.me/573177128401?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener');
  });
}

updateMenuSummary();
