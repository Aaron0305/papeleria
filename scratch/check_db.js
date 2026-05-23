const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kgzpqvzqvwyceulqxtrl.supabase.co';
const supabaseKey = 'sb_publishable_2vadku1ethCvdW1XHtaukg_rWQ0iJxu';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log('--- Comprobando estado de la Base de Datos ---');
  
  // 1. Verificar si el producto comodín con ID 9999 existe
  console.log('\n1. Verificando producto comodín con ID 9999 (Servicios):');
  const { data: prod9999, error: prod9999Err } = await supabase
    .from('productos')
    .select('*')
    .eq('id', 9999);
    
  if (prod9999Err) {
    console.error('Error al consultar producto 9999:', prod9999Err.message);
  } else {
    console.log('Resultado:', prod9999);
    if (prod9999.length === 0) {
      console.warn('⚠️ ADVERTENCIA: El producto con ID 9999 (comodín para servicios) NO EXISTE en la tabla "productos". Las ventas de servicios variables fallarán si no existe.');
    } else {
      console.log('✅ El producto comodín 9999 existe y está correctamente configurado.');
    }
  }

  // 2. Verificar la tabla servicios_rapidos
  console.log('\n2. Verificando tabla "servicios_rapidos":');
  const { data: servs, error: servsErr } = await supabase
    .from('servicios_rapidos')
    .select('*')
    .limit(5);

  if (servsErr) {
    console.error('⚠️ Error al consultar "servicios_rapidos" (es probable que la tabla no exista):', servsErr.message);
  } else {
    console.log('✅ La tabla "servicios_rapidos" existe. Registros encontrados:', servs);
  }

  // 3. Consultar la estructura o intentar una inserción de prueba en servicios_rapidos si no existe
  console.log('\n3. Verificando inserción en "servicios_rapidos":');
  const { data: insData, error: insErr } = await supabase
    .from('servicios_rapidos')
    .insert([{ nombre: 'Servicio de Prueba Temporal', precio_sugerido: 1.00, color: 'purple' }])
    .select();

  if (insErr) {
    console.error('⚠️ Error al insertar en "servicios_rapidos":', insErr.message);
  } else {
    console.log('✅ Inserción de prueba exitosa:', insData);
    // Eliminar el registro de prueba
    await supabase.from('servicios_rapidos').delete().eq('id', insData[0].id);
    console.log('✅ Registro de prueba eliminado.');
  }
}

checkDb();
