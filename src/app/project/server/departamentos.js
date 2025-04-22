import { getData } from "@/app/api/functions/departamentos";
import styles from "./dbPrueba.module.css"

export default async function Server() {
  const data = await getData();
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Base de datos de departamentos</h1>
      <div className={styles.cardGrid}>
        {data.map((item) => (
          <div key={item.id || item.id_Departamento} className={styles.card}>
            <h2 className={styles.cardTitle}>Departamento: {item.id_Departamento}</h2>
            <div className={styles.cardContent}>

              <p className={styles.cardField}>
                <span className={styles.cardLabel}>Nombre:</span> {item.Nombre}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
